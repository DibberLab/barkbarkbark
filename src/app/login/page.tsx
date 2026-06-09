'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      login,
      password,
      redirect: false,
    })

    setLoading(false)
    if (res?.error) {
      setError('Invalid credentials')
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-xs">
        <h1 className="text-void-accent text-sm uppercase tracking-widest mb-6">sign in</h1>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="label">username or email</label>
            <input
              className="input"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              autoComplete="username"
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
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="btn-accent justify-center">
            {loading ? 'signing in...' : 'sign in'}
          </button>
        </form>
        <p className="text-xs text-void-muted mt-4">
          no account?{' '}
          <Link href="/register" className="hover:text-void-text transition-colors">register</Link>
        </p>
      </div>
    </div>
  )
}
