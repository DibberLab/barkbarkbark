'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Tab = 'text' | 'link' | 'image' | 'audio' | 'file'

interface Props {
  channelId: string
  onClose: () => void
}

export default function AddBlockModal({ channelId, onClose }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('text')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // TEXT
  const [textContent, setTextContent] = useState('')
  const [textDesc, setTextDesc] = useState('')

  // LINK
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [linkDesc, setLinkDesc] = useState('')

  // FILE/IMAGE/AUDIO
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileTitle, setFileTitle] = useState('')
  const [fileDesc, setFileDesc] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{
    fileUrl: string; fileName: string; fileMime: string; fileSize: number; type: string
  } | null>(null)

  const resetFileInput = () => {
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    setError('')
    setUploadedFile(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      let data: Record<string, unknown>
      try {
        data = await res.json()
      } catch {
        console.error('[upload] non-JSON response, status:', res.status)
        setError(`Upload failed (HTTP ${res.status})`)
        setUploading(false)
        resetFileInput()
        return
      }
      if (!res.ok) {
        console.error('[upload] error response:', data)
        setError((data.error as string) || 'Upload failed')
        setUploading(false)
        resetFileInput()
        return
      }
      console.log('[upload] success:', data)
      setUploadedFile(data as { fileUrl: string; fileName: string; fileMime: string; fileSize: number; type: string })
    } catch (err) {
      console.error('[upload] fetch error:', err)
      setError('Network error during upload')
    } finally {
      setUploading(false)
      resetFileInput()
    }
  }

  const submit = async () => {
    setLoading(true)
    setError('')
    let body: Record<string, unknown>

    if (tab === 'text') {
      if (!textContent.trim()) { setError('Content required'); setLoading(false); return }
      body = { type: 'TEXT', content: textContent, description: textDesc || undefined }
    } else if (tab === 'link') {
      if (!linkUrl.trim()) { setError('URL required'); setLoading(false); return }
      body = { type: 'LINK', source: linkUrl, title: linkTitle, description: linkDesc }
    } else {
      if (!uploadedFile) { setError('Upload a file first'); setLoading(false); return }
      body = { ...uploadedFile, type: uploadedFile.type, title: fileTitle, description: fileDesc || undefined }
    }

    try {
      const res = await fetch(`/api/channels/${channelId}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      let data: Record<string, unknown>
      try {
        data = await res.json()
      } catch {
        setError(`Server error (HTTP ${res.status})`)
        setLoading(false)
        return
      }
      if (!res.ok) {
        console.error('[blocks] error:', data)
        setError((data.error as string) || 'Failed to add block')
        setLoading(false)
        return
      }
      router.refresh()
      onClose()
    } catch (err) {
      console.error('[blocks] fetch error:', err)
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'text', label: 'TEXT' },
    { id: 'link', label: 'LINK' },
    { id: 'image', label: 'IMAGE' },
    { id: 'audio', label: 'AUDIO' },
    { id: 'file', label: 'FILE' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-md bg-void-surface border border-void-border flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-void-border">
          <span className="text-xs text-void-muted uppercase tracking-widest">add block</span>
          <button onClick={onClose} className="text-void-muted hover:text-void-text transition-colors text-lg leading-none">×</button>
        </div>

        {/* tabs */}
        <div className="flex border-b border-void-border">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTab(t.id); setUploadedFile(null); setError(''); resetFileInput() }}
              className={`px-3 py-2 text-2xs tracking-widest transition-colors ${
                tab === t.id
                  ? 'text-void-accent border-b border-void-accent'
                  : 'text-void-muted hover:text-void-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* body */}
        <div className="p-4 flex flex-col gap-3">
          {tab === 'text' && (
            <>
              <div>
                <label className="label">content</label>
                <textarea
                  className="input min-h-[120px] resize-y"
                  placeholder="write something..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                />
              </div>
              <div>
                <label className="label">description (optional)</label>
                <input className="input" placeholder="add a description..." value={textDesc} onChange={(e) => setTextDesc(e.target.value)} />
              </div>
            </>
          )}

          {tab === 'link' && (
            <>
              <div>
                <label className="label">url</label>
                <input className="input" placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
              </div>
              <div>
                <label className="label">title (optional)</label>
                <input className="input" placeholder="title" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} />
              </div>
              <div>
                <label className="label">description (optional)</label>
                <input className="input" placeholder="description" value={linkDesc} onChange={(e) => setLinkDesc(e.target.value)} />
              </div>
            </>
          )}

          {(tab === 'image' || tab === 'audio' || tab === 'file') && (
            <>
              <div>
                <label className="label">title (optional)</label>
                <input className="input" placeholder="title" value={fileTitle} onChange={(e) => setFileTitle(e.target.value)} />
              </div>
              <div>
                <label className="label">description (optional)</label>
                <input className="input" placeholder="add a description..." value={fileDesc} onChange={(e) => setFileDesc(e.target.value)} />
              </div>
              <div>
                <label className="label">file</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept={
                    tab === 'audio' ? 'audio/*' :
                    tab === 'image' ? 'image/*' :
                    '*'
                  }
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleUpload(f)
                  }}
                />
                <button
                  type="button"
                  className="btn w-full justify-center"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'uploading...' : uploadedFile ? `✓ ${uploadedFile.fileName}` : 'choose file'}
                </button>
              </div>
            </>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* footer */}
        <div className="flex gap-2 px-4 pb-4">
          <button type="button" onClick={onClose} className="btn flex-1 justify-center">cancel</button>
          <button onClick={submit} disabled={loading} className="btn-accent flex-1 justify-center">
            {loading ? 'adding...' : 'add block'}
          </button>
        </div>
      </div>
    </div>
  )
}
