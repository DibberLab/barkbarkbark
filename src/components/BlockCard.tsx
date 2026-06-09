'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import AudioPlayer from './AudioPlayer'
import BlockDetailModal from './BlockDetailModal'
import { formatDate, formatBytes } from '@/lib/utils'
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

  return (
    <>
      <div
        className="card flex flex-col group relative cursor-pointer hover:border-void-muted transition-colors"
        onClick={() => setOpen(true)}
      >
        {/* type badge */}
        <div className={`flex items-center justify-between px-3 pt-2.5 pb-1 border-b border-void-border ${TYPE_COLORS[block.type]}`}>
          <span className="type-badge">{block.type}</span>
          {canRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove?.() }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-void-muted hover:text-red-500 text-xs"
              aria-label="Remove block"
            >
              ×
            </button>
          )}
        </div>

        {/* content */}
        <div className="p-3 flex-1 overflow-hidden">
          {block.type === 'TEXT' && (
            <p className="text-sm text-void-text whitespace-pre-wrap leading-relaxed line-clamp-6">
              {block.content}
            </p>
          )}

          {block.type === 'LINK' && (
            <div className="flex flex-col gap-1">
              {block.title && (
                <p className="text-sm text-void-text line-clamp-2">{block.title}</p>
              )}
              {block.description && (
                <p className="text-xs text-void-muted line-clamp-2">{block.description}</p>
              )}
              <p className="text-xs text-blue-400 truncate mt-1">{block.source}</p>
            </div>
          )}

          {block.type === 'IMAGE' && block.fileUrl && (
            <div className="relative aspect-square w-full overflow-hidden bg-void-bg">
              <Image
                src={block.fileUrl}
                alt={block.title || block.fileName || 'image'}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}

          {block.type === 'AUDIO' && block.fileUrl && (
            <div onClick={(e) => e.stopPropagation()}>
              <AudioPlayer
                src={block.fileUrl}
                title={block.title}
                fileName={block.fileName}
              />
            </div>
          )}

          {block.type === 'FILE' && (
            <div className="flex flex-col gap-1">
              <p className="text-sm text-void-text truncate">
                {block.title || block.fileName}
              </p>
              {block.fileSize && (
                <p className="text-xs text-void-muted">{formatBytes(block.fileSize)}</p>
              )}
            </div>
          )}

          {block.description && block.type !== 'LINK' && (
            <p className="text-xs text-void-muted mt-2 line-clamp-2">{block.description}</p>
          )}
        </div>

        {/* footer */}
        <div className="px-3 pb-2.5 pt-1 border-t border-void-border flex items-center justify-between gap-2">
          <Link
            href={`/${block.user.username}`}
            onClick={(e) => e.stopPropagation()}
            className="text-2xs text-void-muted hover:text-void-text transition-colors truncate"
          >
            {block.user.username}
          </Link>
          <span className="text-2xs text-void-dim flex-shrink-0">
            {formatDate(block.createdAt)}
          </span>
        </div>
      </div>

      {open && <BlockDetailModal block={block} onClose={() => setOpen(false)} />}
    </>
  )
}
