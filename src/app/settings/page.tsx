'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'

export default function Settings() {
  const { data: session } = useSession()
  const [bio, setBio] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    setError('')

    const body: Record<string, string> = { bio }
    if (newPassword) { body.newPassword = newPassword; body.currentPassword = currentPassword }

    const res = await fetch('/api/account', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Update failed'); return }
    setMsg('Saved.')
    setCurrentPassword('')
    setNewPassword('')
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-xs uppercase tracking-widest text-void-muted mb-6">settings</h1>
      <div className="text-xs text-void-muted mb-6">
        signed in as <span className="text-void-text">{(session?.user as { name?: string })?.name}</span>
      </div>

      <form onSubmit={save} className="flex flex-col gap-4">
        <div>
          <label className="label">bio</label>
          <textarea
            className="input min-h-[80px] resize-y"
            maxLength={300}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="a short bio..."
          />
        </div>

        <hr className="border-void-border" />

        <div>
          <label className="label">current password</label>
          <input type="password" className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <label className="label">new password</label>
          <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} />
        </div>

        {msg && <p className="text-xs text-void-accent">{msg}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}

        <button type="submit" disabled={loading} className="btn-accent justify-center">
          {loading ? 'saving...' : 'save changes'}
        </button>
      </form>
    </div>
  )
}
