import { prisma } from '@/lib/db'
import { getAuth } from '@/lib/auth'
import ChannelCard from '@/components/ChannelCard'
import ExploreBlockGrid from '@/components/ExploreBlockGrid'
import type { ChannelData, BlockData } from '@/types'

export const dynamic = 'force-dynamic'

export default async function Explore() {
  const [session, channels, blocks] = await Promise.all([
    getAuth(),
    prisma.channel.findMany({
      where: { status: { in: ['PUBLIC', 'CLOSED'] } },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        _count: { select: { connections: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    }),
    prisma.block.findMany({
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        _count: { select: { connections: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  const currentUserId = (session?.user as { id?: string })?.id ?? null

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-10">
      <section>
        <h2 className="text-xs uppercase tracking-widest text-void-muted mb-4">recent channels</h2>
        {channels.length === 0 ? (
          <p className="text-void-muted text-sm">nothing yet</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {channels.map((ch) => (
              <ChannelCard key={ch.id} channel={ch as unknown as ChannelData} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest text-void-muted mb-4">recent blocks</h2>
        <ExploreBlockGrid
          blocks={blocks as unknown as BlockData[]}
          currentUserId={currentUserId}
        />
      </section>
    </div>
  )
}
