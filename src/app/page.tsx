import { getAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ChannelCard from '@/components/ChannelCard'
import type { ChannelData } from '@/types'

export default async function Home() {
  const session = await getAuth()

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="text-center max-w-sm">
          <h1 className="text-void-accent text-4xl font-semibold tracking-tighter mb-3">VOID</h1>
          <p className="text-void-muted text-sm mb-8 leading-relaxed">
            channels for the obscure. collect blocks of text, links,<br />images, and sound.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/register" className="btn-accent">register</Link>
            <Link href="/login" className="btn">sign in</Link>
          </div>
          <div className="mt-6">
            <Link href="/explore" className="text-xs text-void-muted hover:text-void-text transition-colors">
              browse without account →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const userId = (session.user as { id: string }).id

  const channels = await prisma.channel.findMany({
    where: { userId },
    include: {
      user: { select: { id: true, username: true, avatar: true } },
      _count: { select: { connections: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs uppercase tracking-widest text-void-muted">your channels</h2>
        <Link href="/channels/new" className="btn-accent">+ new channel</Link>
      </div>

      {channels.length === 0 ? (
        <div className="border border-dashed border-void-border p-12 text-center">
          <p className="text-void-muted text-sm mb-4">no channels yet</p>
          <Link href="/channels/new" className="btn">create your first channel</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {channels.map((ch) => (
            <ChannelCard key={ch.id} channel={ch as unknown as ChannelData} />
          ))}
        </div>
      )}
    </div>
  )
}
