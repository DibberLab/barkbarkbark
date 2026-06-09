import { prisma } from '@/lib/db'
import { getAuth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import ChannelCard from '@/components/ChannelCard'
import { formatDate } from '@/lib/utils'
import type { ChannelData } from '@/types'

interface Props {
  params: { username: string }
}

export default async function UserProfile({ params }: Props) {
  const session = await getAuth()
  const requesterId = (session?.user as { id?: string })?.id

  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: {
      channels: {
        where: {
          OR: [
            { status: 'PUBLIC' },
            { status: 'CLOSED' },
            ...(requesterId ? [{ userId: requesterId }] : []),
          ],
        },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          _count: { select: { connections: true } },
        },
        orderBy: { updatedAt: 'desc' },
      },
      _count: { select: { blocks: true } },
    },
  })

  if (!user) notFound()

  const isOwn = requesterId === user.id

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-medium text-void-text">{user.username}</h1>
          {isOwn && (
            <a href="/settings" className="text-xs text-void-muted hover:text-void-text transition-colors">
              edit
            </a>
          )}
        </div>
        {user.bio && (
          <p className="text-sm text-void-muted max-w-sm leading-relaxed">{user.bio}</p>
        )}
        <p className="text-2xs text-void-dim">
          {user.channels.length} channels · {user._count.blocks} blocks · joined {formatDate(user.createdAt)}
        </p>
      </div>

      {user.channels.length === 0 ? (
        <div className="border border-dashed border-void-border p-10 text-center">
          <p className="text-void-muted text-sm">no public channels</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {user.channels.map((ch) => (
            <ChannelCard key={ch.id} channel={ch as unknown as ChannelData} />
          ))}
        </div>
      )}
    </div>
  )
}
