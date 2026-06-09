'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function NewChannel() {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user as { name?: string }
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'PUBLIC' | 'CLOSED' | 'PRIVATE'>('CLOSED')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, status }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Failed to create channel'); return }
    router.push(`/${user?.name}/${data.slug}`)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="text-void-muted hover:text-void-text transition-colors text-xs">← back</Link>
        <h1 className="text-xs uppercase tracking-widest text-void-muted">new channel</h1>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="label">title</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
          />
        </div>
        <div>
          <label className="label">description (optional)</label>
          <textarea
            className="input min-h-[80px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
        </div>
        <div>
          <label className="label">visibility</label>
          <div className="flex gap-2">
            {(['PUBLIC', 'CLOSED', 'PRIVATE'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`btn flex-1 justify-center text-2xs ${status === s ? 'border-void-accent text-void-accent' : ''}`}
              >
                {s.toLowerCase()}
              </button>
            ))}
          </div>
          <p className="text-2xs text-void-muted mt-2">
            {status === 'PUBLIC' && 'anyone can view and add blocks'}
            {status === 'CLOSED' && 'anyone can view, only you can add blocks'}
            {status === 'PRIVATE' && 'only visible to you'}
          </p>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className="btn-accent justify-center mt-2">
          {loading ? 'creating...' : 'create channel'}
        </button>
      </form>
    </div>
  )
}
