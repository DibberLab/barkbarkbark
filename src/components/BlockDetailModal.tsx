'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import AudioPlayer from './AudioPlayer'
import { formatDate, formatBytes } from '@/lib/utils'
import type { BlockData, CommentData, ReactionSummary } from '@/types'

interface Props {
  block: BlockData
  onClose: () => void
}

const TYPE_COLORS: Record<string, string> = {
  TEXT: 'text-void-muted',
  LINK: 'text-blue-400',
  IMAGE: 'text-orange-400',
  AUDIO: 'text-void-accent',
  FILE: 'text-purple-400',
}

export default function BlockDetailModal({ block, onClose }: Props) {
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string })?.id

  const [comments, setComments] = useState<CommentData[]>([])
  const [reactions, setReactions] = useState<ReactionSummary[]>([])
  const [commentBody, setCommentBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reacting, setReacting] = useState(false)
  const commentRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchComments()
    fetchReactions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id])

  async function fetchComments() {
    const res = await fetch(`/api/blocks/${block.id}/comments`)
    if (res.ok) setComments(await res.json())
  }

  async function fetchReactions() {
    const res = await fetch(`/api/blocks/${block.id}/reactions`)
    if (res.ok) setReactions(await res.json())
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentBody.trim() || submitting) return
    setSubmitting(true)
    const res = await fetch(`/api/blocks/${block.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: commentBody.trim() }),
    })
    if (res.ok) {
      const c = await res.json()
      setComments((prev) => [...prev, c])
      setCommentBody('')
    }
    setSubmitting(false)
  }

  async function deleteComment(commentId: string) {
    const res = await fetch(`/api/blocks/${block.id}/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  async function toggleReaction(emoji: string) {
    if (!userId || reacting) return
    setReacting(true)
    setReactions((prev) =>
      prev.map((r) =>
        r.emoji === emoji
          ? { ...r, count: r.userReacted ? r.count - 1 : r.count + 1, userReacted: !r.userReacted }
          : r
      )
    )
    await fetch(`/api/blocks/${block.id}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    })
    await fetchReactions()
    setReacting(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/80"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative flex flex-col md:flex-row w-full max-w-5xl my-0 md:my-8 bg-void-surface border border-void-border overflow-hidden">
        {/* close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-void-muted hover:text-void-text transition-colors text-lg leading-none"
          aria-label="Close"
        >
          ×
        </button>

        {/* left — content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto border-b md:border-b-0 md:border-r border-void-border">
          {/* type badge */}
          <div className={`px-5 pt-4 pb-2 border-b border-void-border flex items-center gap-2 ${TYPE_COLORS[block.type]}`}>
            <span className="type-badge">{block.type}</span>
            {block.title && (
              <span className="text-sm text-void-text truncate">{block.title}</span>
            )}
          </div>

          {/* main content */}
          <div className="flex-1 p-5 flex flex-col gap-4">
            {block.type === 'TEXT' && (
              <p className="text-sm text-void-text whitespace-pre-wrap leading-relaxed">
                {block.content}
              </p>
            )}

            {block.type === 'LINK' && (
              <div className="flex flex-col gap-2">
                {block.title && (
                  <p className="text-base text-void-text font-medium">{block.title}</p>
                )}
                <a
                  href={block.source!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:underline break-all"
                >
                  {block.source}
                </a>
              </div>
            )}

            {block.type === 'IMAGE' && block.fileUrl && (
              <div className="relative w-full overflow-hidden bg-void-bg flex items-center justify-center" style={{ minHeight: '240px' }}>
                <Image
                  src={block.fileUrl}
                  alt={block.title || block.fileName || 'image'}
                  width={800}
                  height={600}
                  className="object-contain max-h-[60vh] w-auto"
                  unoptimized
                />
              </div>
            )}

            {block.type === 'AUDIO' && block.fileUrl && (
              <AudioPlayer src={block.fileUrl} title={block.title} fileName={block.fileName} />
            )}

            {block.type === 'FILE' && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-void-text">{block.title || block.fileName}</p>
                {block.fileSize && (
                  <p className="text-xs text-void-muted">{formatBytes(block.fileSize)}</p>
                )}
                {block.fileUrl && (
                  <a
                    href={block.fileUrl}
                    download={block.fileName ?? true}
                    className="text-xs text-purple-400 hover:underline"
                  >
                    download
                  </a>
                )}
              </div>
            )}

            {block.description && (
              <p className="text-sm text-void-muted leading-relaxed border-t border-void-border pt-3">
                {block.description}
              </p>
            )}
          </div>
        </div>

        {/* right — sidebar */}
        <div className="w-full md:w-72 flex-shrink-0 flex flex-col overflow-y-auto">
          {/* meta */}
          <div className="px-4 py-3 border-b border-void-border flex flex-col gap-1">
            <div className="flex items-center gap-1 text-xs text-void-muted">
              <span>added by</span>
              <Link href={`/${block.user.username}`} className="hover:text-void-text transition-colors">
                {block.user.username}
              </Link>
            </div>
            <span className="text-2xs text-void-dim">{formatDate(block.createdAt)}</span>
            {block._count !== undefined && (
              <span className="text-2xs text-void-dim">{block._count.connections} connection{block._count.connections !== 1 ? 's' : ''}</span>
            )}
          </div>

          {/* reactions */}
          <div className="px-4 py-3 border-b border-void-border">
            <p className="text-2xs uppercase tracking-widest text-void-dim mb-2">reactions</p>
            <div className="flex flex-wrap gap-1.5">
              {reactions.map((r) => (
                <button
                  key={r.emoji}
                  onClick={() => toggleReaction(r.emoji)}
                  disabled={!userId}
                  className={`flex items-center gap-1 px-2 py-0.5 text-xs border transition-colors rounded-sm ${
                    r.userReacted
                      ? 'border-void-accent text-void-accent bg-void-accent/10'
                      : 'border-void-border text-void-muted hover:border-void-muted'
                  } disabled:opacity-50 disabled:cursor-default`}
                >
                  <span>{r.emoji}</span>
                  {r.count > 0 && <span>{r.count}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* comments */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-2 border-b border-void-border">
              <p className="text-2xs uppercase tracking-widest text-void-dim">
                comments {comments.length > 0 && `(${comments.length})`}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
              {comments.length === 0 && (
                <p className="text-xs text-void-dim">no comments yet</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex flex-col gap-0.5 group">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/${c.user.username}`}
                      className="text-2xs text-void-accent hover:text-void-text transition-colors"
                    >
                      {c.user.username}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-2xs text-void-dim">{formatDate(c.createdAt)}</span>
                      {c.user.id === userId && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-2xs text-void-dim hover:text-red-500"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-void-text leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>

            {session ? (
              <form onSubmit={submitComment} className="border-t border-void-border p-3 flex flex-col gap-2">
                <textarea
                  ref={commentRef}
                  className="input text-xs min-h-[60px] resize-none"
                  placeholder="add a comment..."
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitComment(e as unknown as React.FormEvent)
                  }}
                />
                <button
                  type="submit"
                  disabled={submitting || !commentBody.trim()}
                  className="btn-accent text-xs justify-center"
                >
                  {submitting ? 'posting...' : 'post'}
                </button>
              </form>
            ) : (
              <div className="border-t border-void-border p-3">
                <p className="text-2xs text-void-dim">
                  <Link href="/login" className="text-void-accent hover:underline">sign in</Link> to comment
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
