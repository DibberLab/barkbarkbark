import { prisma } from '@/lib/db'
import { getAuth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import BlockCard from '@/components/BlockCard'
import ChannelControls from './ChannelControls'
import type { ConnectionData } from '@/types'

interface Props {
  params: { username: string; channelSlug: string }
}

export default async function ChannelPage({ params }: Props) {
  const session = await getAuth()
  const requesterId = (session?.user as { id?: string })?.id

  const owner = await prisma.user.findUnique({ where: { username: params.username } })
  if (!owner) notFound()

  const channel = await prisma.channel.findUnique({
    where: { userId_slug: { userId: owner.id, slug: params.channelSlug } },
    include: {
      user: { select: { id: true, username: true, avatar: true } },
      _count: { select: { connections: true } },
    },
  })

  if (!channel) notFound()
  if (channel.status === 'PRIVATE' && channel.userId !== requesterId) notFound()

  const connections = await prisma.connection.findMany({
    where: { channelId: channel.id },
    include: {
      block: {
        include: { user: { select: { id: true, username: true, avatar: true } } },
      },
      user: { select: { id: true, username: true, avatar: true } },
    },
    orderBy: { position: 'asc' },
  })

  const isOwner = requesterId === channel.userId
  const canAdd =
    isOwner || (channel.status === 'PUBLIC' && !!requesterId)

  const STATUS_LABEL: Record<string, string> = {
    PUBLIC: 'open',
    CLOSED: 'closed',
    PRIVATE: 'private',
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* header */}
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-void-muted mb-1">
              <a href={`/${params.username}`} className="hover:text-void-text transition-colors">
                {params.username}
              </a>
              <span>/</span>
              <span className="text-void-dim">{STATUS_LABEL[channel.status]}</span>
            </div>
            <h1 className="text-xl font-medium text-void-text">{channel.title}</h1>
          </div>
          <ChannelControls
            channelId={channel.id}
            canAdd={canAdd}
            isOwner={isOwner}
            ownerUsername={params.username}
          />
        </div>

        {channel.description && (
          <p className="text-sm text-void-muted max-w-xl leading-relaxed mt-1">
            {channel.description}
          </p>
        )}

        <p className="text-2xs text-void-dim mt-1">
          {channel._count.connections} blocks · updated {formatDate(channel.updatedAt)}
        </p>
      </div>

      {/* blocks */}
      {connections.length === 0 ? (
        <div className="border border-dashed border-void-border p-12 text-center">
          <p className="text-void-muted text-sm">empty channel</p>
          {canAdd && (
            <p className="text-xs text-void-dim mt-2">add something above</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {connections.map((conn) => (
            <BlockCard
              key={conn.id}
              block={conn.block as unknown as ConnectionData['block']}
              canRemove={isOwner}
            />
          ))}
        </div>
      )}
    </div>
  )
}
