'use client'
import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import AudioPlayer from './AudioPlayer'
import RichTextEditor, { normalizeContent, isEmptyHtml } from './RichTextEditor'
import { formatDate, formatBytes, getVideoInfo, isImageUrl, extractSingleImageUrl, extractSingleVideoInfo } from '@/lib/utils'
import type { BlockData, ChannelData, CommentData, ReactionSummary } from '@/types'

interface Props {
  block: BlockData
  onClose: () => void
  onUpdate?: (updated: BlockData) => void
}

const TYPE_COLORS: Record<string, string> = {
  TEXT: 'text-void-muted',
  LINK: 'text-blue-400',
  IMAGE: 'text-orange-400',
  AUDIO: 'text-void-accent',
  FILE: 'text-purple-400',
}

function VideoEmbed({ embedUrl }: { embedUrl: string }) {
  return (
    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

function CommentVideo({ embedUrl, thumbnailUrl }: { embedUrl: string; thumbnailUrl: string }) {
  const [playing, setPlaying] = useState(false)
  if (playing) return <VideoEmbed embedUrl={embedUrl} />
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

function AutoTextarea({ value, onChange, onBlur, placeholder, className }: {
  value: string
  onChange: (v: string) => void
  onBlur: () => void
  placeholder?: string
  className?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = ref.current.scrollHeight + 'px'
    }
  }, [value])
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      className={`resize-none overflow-hidden bg-transparent w-full outline-none border-b border-transparent focus:border-void-border transition-colors placeholder:text-void-dim ${className ?? ''}`}
    />
  )
}

function ActionsMenu({ block }: { block: BlockData }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function copyLink() {
    let url = window.location.href
    if (block.type === 'LINK' && block.source) url = block.source
    else if (block.fileUrl) url = `${window.location.origin}${block.fileUrl}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => { setCopied(false); setOpen(false) }, 1200)
  }

  return (
    <div ref={ref} className="relative flex-shrink-0 ml-auto">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-void-dim hover:text-void-muted transition-colors px-1 text-base leading-none"
        title="actions"
      >
        ···
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-void-surface border border-void-border z-20 min-w-[148px] py-1">
          <button
            onClick={copyLink}
            className="block w-full text-left px-3 py-1.5 text-xs text-void-muted hover:text-void-text hover:bg-void-raised transition-colors"
          >
            {copied ? '✓ copied' : block.type === 'LINK' ? 'copy url' : 'copy link'}
          </button>
          {block.type === 'LINK' && block.source && (
            <a
              href={block.source}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block px-3 py-1.5 text-xs text-void-muted hover:text-void-text hover:bg-void-raised transition-colors"
            >
              open url ↗
            </a>
          )}
          {(block.type === 'IMAGE' || block.type === 'AUDIO' || block.type === 'FILE') && block.fileUrl && (
            <a
              href={block.fileUrl}
              download={block.fileName ?? true}
              onClick={() => setOpen(false)}
              className="block px-3 py-1.5 text-xs text-void-muted hover:text-void-text hover:bg-void-raised transition-colors"
            >
              download
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function ConnectSection({ blockId }: { blockId: string }) {
  const [channels, setChannels] = useState<ChannelData[]>([])
  const [query, setQuery] = useState('')
  const [states, setStates] = useState<Record<string, 'idle' | 'connecting' | 'connected' | 'exists'>>({})

  useEffect(() => {
    fetch('/api/channels')
      .then((r) => r.ok ? r.json() : [])
      .then(setChannels)
  }, [])

  if (channels.length === 0) return null

  const filtered = query
    ? channels.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
    : channels

  async function connect(channelId: string) {
    const cur = states[channelId]
    if (cur === 'connecting' || cur === 'connected') return
    setStates((prev) => ({ ...prev, [channelId]: 'connecting' }))
    const res = await fetch(`/api/channels/${channelId}/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockId }),
    })
    setStates((prev) => ({ ...prev, [channelId]: res.ok ? 'connected' : 'exists' }))
  }

  return (
    <div className="px-4 py-3 border-b border-void-border">
      <p className="text-2xs uppercase tracking-widest text-void-dim mb-2">connect to</p>
      {channels.length > 5 && (
        <input
          className="input text-xs py-1 mb-2"
          placeholder="search channels..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}
      <div className="flex flex-col max-h-[160px] overflow-y-auto">
        {filtered.map((ch) => {
          const s = states[ch.id] ?? 'idle'
          return (
            <button
              key={ch.id}
              onClick={() => connect(ch.id)}
              disabled={s === 'connecting' || s === 'connected'}
              className={`text-left text-xs px-1 py-1 rounded-sm transition-colors flex items-center justify-between gap-2 group ${
                s === 'connected' ? 'text-void-accent' :
                s === 'exists'    ? 'text-void-dim' :
                'text-void-muted hover:text-void-text'
              }`}
            >
              <span className="truncate">{ch.title}</span>
              <span className="flex-shrink-0 text-void-dim group-hover:text-void-muted transition-colors">
                {s === 'connecting' ? '···' :
                 s === 'connected'  ? '✓' :
                 s === 'exists'     ? 'already added' :
                 '→'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function BlockDetailModal({ block, onClose, onUpdate }: Props) {
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string })?.id
  const isOwner = !!userId && userId === block.user.id

  const [localTitle, setLocalTitle] = useState(block.title ?? '')
  const [localDescription, setLocalDescription] = useState(block.description ?? '')
  const [localContent, setLocalContent] = useState(block.content ?? '')

  const savedTitle = useRef(block.title ?? '')
  const savedDescription = useRef(block.description ?? '')
  const savedContent = useRef(block.content ?? '')

  const [comments, setComments] = useState<CommentData[]>([])
  const [reactions, setReactions] = useState<ReactionSummary[]>([])
  const [commentBody, setCommentBody] = useState('')
  const [commentKey, setCommentKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [reacting, setReacting] = useState(false)

  useEffect(() => {
    fetchComments()
    fetchReactions()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id])

  async function saveField(field: 'title' | 'description' | 'content', value: string) {
    const r = field === 'title' ? savedTitle : field === 'description' ? savedDescription : savedContent
    if (value === r.current) return
    r.current = value
    const res = await fetch(`/api/blocks/${block.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    if (res.ok) onUpdate?.(await res.json())
  }

  async function fetchComments() {
    const res = await fetch(`/api/blocks/${block.id}/comments`)
    if (res.ok) setComments(await res.json())
  }

  async function fetchReactions() {
    const res = await fetch(`/api/blocks/${block.id}/reactions`)
    if (res.ok) setReactions(await res.json())
  }

  async function submitComment() {
    if (isEmptyHtml(commentBody) || submitting) return
    setSubmitting(true)
    const res = await fetch(`/api/blocks/${block.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: commentBody }),
    })
    if (res.ok) {
      const c = await res.json()
      setComments((prev) => [...prev, c])
      setCommentBody('')
      setCommentKey((k) => k + 1)
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
      prev.map((r) => r.emoji === emoji
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
          {/* type badge + title + actions */}
          <div className={`px-5 pt-4 pb-2 border-b border-void-border flex items-center gap-2 ${TYPE_COLORS[block.type]}`}>
            <span className="type-badge flex-shrink-0">{block.type}</span>
            {isOwner ? (
              <AutoTextarea
                value={localTitle}
                onChange={setLocalTitle}
                onBlur={() => saveField('title', localTitle)}
                placeholder="title..."
                className="text-sm text-void-text"
              />
            ) : (
              block.title && <span className="text-sm text-void-text truncate">{block.title}</span>
            )}
            <ActionsMenu block={block} />
          </div>

          {/* main content */}
          <div className="flex-1 p-5 flex flex-col gap-4">
            {block.type === 'TEXT' && (
              isOwner ? (
                <RichTextEditor
                  content={localContent}
                  onChange={setLocalContent}
                  onBlur={() => saveField('content', localContent)}
                  placeholder="write something..."
                />
              ) : (
                <div
                  className="rte-view"
                  dangerouslySetInnerHTML={{ __html: normalizeContent(block.content ?? '') }}
                />
              )
            )}

            {block.type === 'LINK' && (() => {
              const src = block.source ?? ''
              const video = src ? getVideoInfo(src) : null
              const isImg = !video && src && isImageUrl(src)
              return (
                <div className="flex flex-col gap-2">
                  {video ? (
                    <VideoEmbed embedUrl={video.embedUrl} />
                  ) : isImg ? (
                    <div className="relative w-full overflow-hidden bg-void-bg flex items-center justify-center" style={{ minHeight: '240px' }}>
                      <Image src={src} alt={block.title || 'image'} width={800} height={600} className="object-contain max-h-[60vh] w-auto" unoptimized />
                    </div>
                  ) : (
                    block.title && <p className="text-base text-void-text font-medium">{block.title}</p>
                  )}
                  <a href={src} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:underline break-all">
                    {src}
                  </a>
                </div>
              )
            })()}

            {block.type === 'IMAGE' && block.fileUrl && (
              <div className="relative w-full overflow-hidden bg-void-bg flex items-center justify-center" style={{ minHeight: '240px' }}>
                <Image src={block.fileUrl} alt={block.title || block.fileName || 'image'}
                  width={800} height={600} className="object-contain max-h-[60vh] w-auto" unoptimized />
              </div>
            )}

            {block.type === 'AUDIO' && block.fileUrl && (
              <AudioPlayer src={block.fileUrl} title={block.title} fileName={block.fileName} />
            )}

            {block.type === 'FILE' && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-void-text">{block.title || block.fileName}</p>
                {block.fileSize && <p className="text-xs text-void-muted">{formatBytes(block.fileSize)}</p>}
                {block.fileUrl && (
                  <a href={block.fileUrl} download={block.fileName ?? true}
                    className="text-xs text-purple-400 hover:underline">download</a>
                )}
              </div>
            )}

            {/* description */}
            {isOwner ? (
              <div className="border-t border-void-border pt-3">
                <AutoTextarea
                  value={localDescription}
                  onChange={setLocalDescription}
                  onBlur={() => saveField('description', localDescription)}
                  placeholder="description..."
                  className="text-sm text-void-muted leading-relaxed"
                />
              </div>
            ) : (
              block.description && (
                <p className="text-sm text-void-muted leading-relaxed border-t border-void-border pt-3">
                  {block.description}
                </p>
              )
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
              <span className="text-2xs text-void-dim">
                {block._count.connections} connection{block._count.connections !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* connect */}
          {session && <ConnectSection blockId={block.id} />}

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
              {comments.length === 0 && <p className="text-xs text-void-dim">no comments yet</p>}
              {comments.map((c) => (
                <div key={c.id} className="flex flex-col gap-0.5 group">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/${c.user.username}`}
                      className="text-2xs text-void-accent hover:text-void-text transition-colors">
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
            </div>

            {session ? (
              <div className="border-t border-void-border p-3 flex flex-col gap-2">
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
                <button
                  type="button"
                  onClick={submitComment}
                  disabled={submitting || isEmptyHtml(commentBody)}
                  className="btn-accent text-xs justify-center">
                  {submitting ? 'posting...' : 'post'}
                </button>
              </div>
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
