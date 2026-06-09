'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Register() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setLoading(false)
      setError(typeof data.error === 'string' ? data.error : 'Registration failed')
      return
    }

    await signIn('credentials', { login: username, password, redirect: false })
    router.push('/')
    router.refresh()
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-xs">
        <h1 className="text-void-accent text-sm uppercase tracking-widest mb-6">create account</h1>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="label">username</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              pattern="[a-zA-Z0-9_\-]+"
              minLength={2}
              maxLength={30}
              required
            />
          </div>
          <div>
            <label className="label">email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="btn-accent justify-center">
            {loading ? 'creating account...' : 'create account'}
          </button>
        </form>
        <p className="text-xs text-void-muted mt-4">
          have an account?{' '}
          <Link href="/login" className="hover:text-void-text transition-colors">sign in</Link>
        </p>
      </div>
    </div>
  )
}
