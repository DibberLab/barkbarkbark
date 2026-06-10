import { prisma } from '@/lib/db'
import { getAuth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import AudioPlayer from '@/components/AudioPlayer'
import BlockInteractions from '@/components/BlockInteractions'
import { normalizeContent } from '@/components/RichTextEditor'
import { formatDate, formatBytes, getVideoInfo, isImageUrl } from '@/lib/utils'
import type { BlockData } from '@/types'
import type { Metadata } from 'next'

const TYPE_COLORS: Record<string, string> = {
  TEXT: 'text-void-muted',
  LINK: 'text-blue-400',
  IMAGE: 'text-orange-400',
  AUDIO: 'text-void-accent',
  FILE: 'text-purple-400',
}

export async function generateMetadata({ params }: { params: { blockId: string } }): Promise<Metadata> {
  const block = await prisma.block.findUnique({
    where: { id: params.blockId },
    select: { title: true, type: true, description: true },
  })
  if (!block) return {}
  return { title: block.title ?? block.type.toLowerCase() }
}

export const dynamic = 'force-dynamic'

export default async function BlockPage({ params }: { params: { blockId: string } }) {
  const [session, block] = await Promise.all([
    getAuth(),
    prisma.block.findUnique({
      where: { id: params.blockId },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        _count: { select: { connections: true } },
      },
    }),
  ])

  if (!block) notFound()

  const currentUserId = (session?.user as { id?: string })?.id ?? null
  const b = block as unknown as BlockData

  const src = b.source ?? ''
  const video = src ? getVideoInfo(src) : null
  const isImg = !video && src && isImageUrl(src)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-8">
      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-2xs text-void-dim">
        <Link href="/" className="hover:text-void-muted transition-colors">home</Link>
        <span>/</span>
        <Link href={`/${b.user.username}`} className="hover:text-void-muted transition-colors">{b.user.username}</Link>
        <span>/</span>
        <span className={TYPE_COLORS[b.type]}>{b.type.toLowerCase()}</span>
      </div>

      {/* block */}
      <div className="card flex flex-col">
        <div className={`px-4 pt-3 pb-2 border-b border-void-border flex items-center justify-between ${TYPE_COLORS[b.type]}`}>
          <span className="type-badge">{b.title || b.type.toLowerCase()}</span>
          <span className="text-2xs text-void-dim">{formatDate(b.createdAt)}</span>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {b.type === 'TEXT' && (
            <div className="rte-view" dangerouslySetInnerHTML={{ __html: normalizeContent(b.content ?? '') }} />
          )}

          {b.type === 'LINK' && (
            <div className="flex flex-col gap-2">
              {video ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={video.embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : isImg ? (
                <div className="relative w-full overflow-hidden bg-void-bg flex items-center justify-center" style={{ minHeight: '240px' }}>
                  <Image src={src} alt={b.title || 'image'} width={800} height={600} className="object-contain max-h-[60vh] w-auto" unoptimized />
                </div>
              ) : (
                b.title && <p className="text-base text-void-text font-medium">{b.title}</p>
              )}
              {b.description && <p className="text-sm text-void-muted">{b.description}</p>}
              <a href={src} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline break-all">{src}</a>
            </div>
          )}

          {b.type === 'IMAGE' && b.fileUrl && (
            <div className="relative w-full overflow-hidden bg-void-bg flex items-center justify-center" style={{ minHeight: '240px' }}>
              <Image src={b.fileUrl} alt={b.title || b.fileName || 'image'} width={800} height={600} className="object-contain max-h-[70vh] w-auto" unoptimized />
            </div>
          )}

          {b.type === 'AUDIO' && b.fileUrl && (
            <AudioPlayer src={b.fileUrl} title={b.title} fileName={b.fileName} />
          )}

          {b.type === 'FILE' && (
            <div className="flex flex-col gap-1">
              <p className="text-sm text-void-text">{b.title || b.fileName}</p>
              {b.fileSize && <p className="text-xs text-void-muted">{formatBytes(b.fileSize)}</p>}
              {b.fileUrl && (
                <a href={b.fileUrl} download={b.fileName ?? true} className="btn self-start mt-1">
                  download
                </a>
              )}
            </div>
          )}

          {b.description && b.type !== 'LINK' && (
            <p className="text-sm text-void-muted">{b.description}</p>
          )}
        </div>

        <div className="px-4 pb-3 pt-2 border-t border-void-border">
          <Link href={`/${b.user.username}`} className="text-2xs text-void-muted hover:text-void-text transition-colors">
            {b.user.username}
          </Link>
        </div>
      </div>

      <BlockInteractions blockId={b.id} currentUserId={currentUserId} />
    </div>
  )
}
