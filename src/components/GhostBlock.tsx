'use client'
import { useState, useRef, useEffect } from 'react'
import type { ConnectionData } from '@/types'

function isUrl(text: string) {
  try { const u = new URL(text); return u.protocol === 'http:' || u.protocol === 'https:' }
  catch { return false }
}

interface Props {
  channelId: string
  onAdd: (conn: ConnectionData) => void
}

export default function GhostBlock({ channelId, onAdd }: Props) {
  const [active, setActive] = useState(false)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return
    function onMouseDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node) && !content.trim()) {
        setActive(false)
        setContent('')
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [active, content])

  function activate() {
    setActive(true)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  function deactivate() {
    setActive(false)
    setContent('')
  }

  async function submit() {
    const val = content.trim()
    if (!val || loading) return
    setLoading(true)
    const body = isUrl(val)
      ? { type: 'LINK', source: val }
      : { type: 'TEXT', content: val }
    const res = await fetch(`/api/channels/${channelId}/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) { deactivate(); onAdd(await res.json()) }
    setLoading(false)
  }

  async function handleFile(file: File) {
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
    if (upRes.ok) {
      const data = await upRes.json()
      const res = await fetch(`/api/channels/${channelId}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) { deactivate(); onAdd(await res.json()) }
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept="image/*,audio/*,*"
      className="hidden"
      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
    />
  )

  if (!active) {
    return (
      <div
        ref={containerRef}
        onClick={activate}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`card border-dashed flex items-center justify-center min-h-[120px] cursor-text transition-colors p-4 ${dragging ? 'border-void-muted bg-void-bg' : 'hover:border-void-muted'}`}
      >
        {fileInput}
        {uploading ? (
          <p className="text-xs text-void-dim">uploading...</p>
        ) : (
          <p className="text-xs text-void-dim leading-relaxed text-center">
            Drop or{' '}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
              className="underline hover:text-void-muted transition-colors"
            >
              choose files
            </button>
            , paste a URL (image, video, or link) or type text here
          </p>
        )}
      </div>
    )
  }

  const val = content.trim()
  const hint = val ? (isUrl(val) ? 'add link' : 'add') : null

  return (
    <div
      ref={containerRef}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`card flex flex-col min-h-[120px] transition-colors ${dragging ? 'border-void-muted' : ''}`}
    >
      {fileInput}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="type or paste a link..."
        className="flex-1 p-3 bg-transparent text-sm text-void-text placeholder:text-void-dim resize-none outline-none"
        style={{ minHeight: '80px' }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') deactivate()
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
        }}
      />
      <div className="px-3 pb-2.5 pt-1 border-t border-void-border flex items-center justify-between">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          title="upload file"
          className="text-void-dim hover:text-void-muted transition-colors text-sm leading-none w-5 h-5 flex items-center justify-center border border-void-border rounded-sm"
        >
          {uploading ? '·' : '+'}
        </button>
        {hint && (
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="text-2xs text-void-accent hover:text-void-text transition-colors"
          >
            {loading ? '···' : hint}
          </button>
        )}
      </div>
    </div>
  )
}
