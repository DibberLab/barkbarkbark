'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import RichTextEditor, { normalizeContent, isEmptyHtml } from './RichTextEditor'
import { formatDate, extractSingleImageUrl, extractSingleVideoInfo } from '@/lib/utils'
import type { CommentData, ReactionSummary } from '@/types'

function CommentVideo({ embedUrl, thumbnailUrl }: { embedUrl: string; thumbnailUrl: string }) {
  const [playing, setPlaying] = useState(false)
  if (playing) {
    return (
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe src={embedUrl} className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    )
  }
  return (
    <div className="relative aspect-video w-full overflow-hidden bg-void-bg cursor-pointer" onClick={() => setPlaying(true)}>
      {thumbnailUrl
        ? <Image src={thumbnailUrl} alt="video" fill className="object-cover" unoptimized />
        : <div className="absolute inset-0 bg-void-raised" />
      }
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-black/70 flex items-center justify-center">
          <span className="text-white text-sm ml-0.5">▶</span>
        </div>
      </div>
    </div>
  )
}

interface Props {
  blockId: string
  currentUserId: string | null
}

export default function BlockInteractions({ blockId, currentUserId }: Props) {
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string })?.id ?? currentUserId

  const [comments, setComments] = useState<CommentData[]>([])
  const [reactions, setReactions] = useState<ReactionSummary[]>([])
  const [commentBody, setCommentBody] = useState('')
  const [commentKey, setCommentKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [reacting, setReacting] = useState(false)

  useEffect(() => {
    fetch(`/api/blocks/${blockId}/comments`).then(r => r.ok && r.json()).then(d => d && setComments(d))
    fetch(`/api/blocks/${blockId}/reactions`).then(r => r.ok && r.json()).then(d => d && setReactions(d))
  }, [blockId])

  async function submitComment() {
    if (isEmptyHtml(commentBody) || submitting) return
    setSubmitting(true)
    const res = await fetch(`/api/blocks/${blockId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: commentBody }),
    })
    if (res.ok) {
      const c = await res.json()
      setComments(prev => [...prev, c])
      setCommentBody('')
      setCommentKey(k => k + 1)
    }
    setSubmitting(false)
  }

  async function deleteComment(commentId: string) {
    const res = await fetch(`/api/blocks/${blockId}/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok) setComments(prev => prev.filter(c => c.id !== commentId))
  }

  async function toggleReaction(emoji: string) {
    if (!userId || reacting) return
    setReacting(true)
    setReactions(prev => prev.map(r => r.emoji === emoji
      ? { ...r, count: r.userReacted ? r.count - 1 : r.count + 1, userReacted: !r.userReacted }
      : r
    ))
    await fetch(`/api/blocks/${blockId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    })
    const r = await fetch(`/api/blocks/${blockId}/reactions`)
    if (r.ok) setReactions(await r.json())
    setReacting(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* reactions */}
      <div className="flex flex-col gap-2">
        <p className="text-2xs uppercase tracking-widest text-void-dim">reactions</p>
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
      <div className="flex flex-col gap-3">
        <p className="text-2xs uppercase tracking-widest text-void-dim">
          comments{comments.length > 0 && ` (${comments.length})`}
        </p>

        {comments.length === 0 && <p className="text-xs text-void-dim">no comments yet</p>}

        {comments.map((c) => (
          <div key={c.id} className="flex flex-col gap-0.5 group">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/${c.user.username}`} className="text-2xs text-void-accent hover:text-void-text transition-colors">
                {c.user.username}
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-2xs text-void-dim">{formatDate(c.createdAt)}</span>
                {c.user.id === userId && (
                  <button onClick={() => deleteComment(c.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-2xs text-void-dim hover:text-red-500">
                    ×
                  </button>
                )}
              </div>
            </div>
            {(() => {
              const video = extractSingleVideoInfo(c.body)
              if (video) return <CommentVideo embedUrl={video.embedUrl} thumbnailUrl={video.thumbnailUrl} />
              const imgUrl = extractSingleImageUrl(c.body)
              if (imgUrl) return <Image src={imgUrl} alt="image" width={400} height={300} className="max-w-full max-h-48 object-contain" unoptimized />
              return <div className="rte-view text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: normalizeContent(c.body) }} />
            })()}
          </div>
        ))}

        {session ? (
          <div className="flex flex-col gap-2 mt-1">
            <div className="input py-2 text-xs">
              <RichTextEditor
                key={commentKey}
                content=""
                onChange={setCommentBody}
                onSubmit={submitComment}
                placeholder="add a comment..."
                minimal
              />
            </div>
            <button type="button" onClick={submitComment} disabled={submitting || isEmptyHtml(commentBody)}
              className="btn-accent text-xs justify-center">
              {submitting ? 'posting...' : 'post'}
            </button>
          </div>
        ) : (
          <p className="text-2xs text-void-dim">
            <Link href="/login" className="text-void-accent hover:underline">sign in</Link> to comment
          </p>
        )}
      </div>
    </div>
  )
}
