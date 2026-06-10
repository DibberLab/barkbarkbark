'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import AudioPlayer from './AudioPlayer'
import BlockDetailModal from './BlockDetailModal'
import { formatDate, formatBytes, getVideoInfo, isImageUrl } from '@/lib/utils'
import { normalizeContent } from './RichTextEditor'
import type { BlockData } from '@/types'

const TYPE_COLORS: Record<string, string> = {
  TEXT: 'text-void-muted',
  LINK: 'text-blue-400',
  IMAGE: 'text-orange-400',
  AUDIO: 'text-void-accent',
  FILE: 'text-purple-400',
}

interface Props {
  block: BlockData
  onRemove?: () => void
  canRemove?: boolean
}

export default function BlockCard({ block, onRemove, canRemove }: Props) {
  const [open, setOpen] = useState(false)
  const [currentBlock, setCurrentBlock] = useState(block)

  return (
    <>
      <div
        className="card flex flex-col group relative cursor-pointer hover:border-void-muted transition-colors"
        onClick={() => setOpen(true)}
      >
        {/* header */}
        <div className={`flex items-center justify-between px-3 pt-2.5 pb-1 border-b border-void-border ${TYPE_COLORS[currentBlock.type]}`}>
          <span className="type-badge truncate">
            {currentBlock.title || currentBlock.type.toLowerCase()}
          </span>
          {canRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove?.() }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-void-muted hover:text-red-500 text-xs flex-shrink-0 ml-1"
              aria-label="Remove block"
            >
              ×
            </button>
          )}
        </div>

        {/* content */}
        <div className="p-3 flex-1 overflow-hidden">
          {currentBlock.type === 'TEXT' && (
            <div
              className="rte-view text-sm line-clamp-6 overflow-hidden"
              dangerouslySetInnerHTML={{ __html: normalizeContent(currentBlock.content ?? '') }}
            />
          )}

          {currentBlock.type === 'LINK' && (() => {
            const src = currentBlock.source ?? ''
            const video = src ? getVideoInfo(src) : null
            const isImg = !video && src && isImageUrl(src)
            return (
              <div className="flex flex-col gap-1">
                {isImg ? (
                  <div className="relative aspect-square w-full overflow-hidden bg-void-bg">
                    <Image src={src} alt={currentBlock.title || 'image'} fill className="object-contain" unoptimized />
                  </div>
                ) : video?.thumbnailUrl ? (
                  <div className="relative aspect-video w-full overflow-hidden bg-void-bg mb-1">
                    <Image src={video.thumbnailUrl} alt={currentBlock.title || 'video'} fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                        <span className="text-white text-xs ml-0.5">▶</span>
                      </div>
                    </div>
                  </div>
                ) : null}
                {currentBlock.title && (
                  <p className="text-sm text-void-text line-clamp-2">{currentBlock.title}</p>
                )}
                {currentBlock.description && (
                  <p className="text-xs text-void-muted line-clamp-2">{currentBlock.description}</p>
                )}
                {!video && !isImg && <p className="text-xs text-blue-400 truncate mt-1">{src}</p>}
              </div>
            )
          })()}

          {currentBlock.type === 'IMAGE' && currentBlock.fileUrl && (
            <div className="relative aspect-square w-full overflow-hidden bg-void-bg">
              <Image
                src={currentBlock.fileUrl}
                alt={currentBlock.title || currentBlock.fileName || 'image'}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}

          {currentBlock.type === 'AUDIO' && currentBlock.fileUrl && (
            <div onClick={(e) => e.stopPropagation()}>
              <AudioPlayer
                src={currentBlock.fileUrl}
                title={currentBlock.title}
                fileName={currentBlock.fileName}
              />
            </div>
          )}

          {currentBlock.type === 'FILE' && (
            <div className="flex flex-col gap-1">
              <p className="text-sm text-void-text truncate">
                {currentBlock.title || currentBlock.fileName}
              </p>
              {currentBlock.fileSize && (
                <p className="text-xs text-void-muted">{formatBytes(currentBlock.fileSize)}</p>
              )}
            </div>
          )}

          {currentBlock.description && currentBlock.type !== 'LINK' && (
            <p className="text-xs text-void-muted mt-2 line-clamp-2">{currentBlock.description}</p>
          )}
        </div>

        {/* footer */}
        <div className="px-3 pb-2.5 pt-1 border-t border-void-border flex items-center justify-between gap-2">
          <Link
            href={`/${currentBlock.user.username}`}
            onClick={(e) => e.stopPropagation()}
            className="text-2xs text-void-muted hover:text-void-text transition-colors truncate"
          >
            {currentBlock.user.username}
          </Link>
          <span className="text-2xs text-void-dim flex-shrink-0">
            {formatDate(currentBlock.createdAt)}
          </span>
        </div>
      </div>

      {open && (
        <BlockDetailModal
          block={currentBlock}
          onClose={() => setOpen(false)}
          onUpdate={setCurrentBlock}
        />
      )}
    </>
  )
}
