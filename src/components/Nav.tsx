'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export default function Nav() {
  const { data: session } = useSession()
  const user = session?.user as { name?: string; id?: string } | undefined
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-10 border-b border-void-border bg-void-bg">
      <Link href="/" className="text-void-accent font-mono text-sm font-semibold tracking-tight hover:opacity-80 transition-opacity">
        barkbarkbark
      </Link>

      <div className="flex items-center gap-4 text-xs text-void-muted">
        <Link href="/explore" className="hover:text-void-text transition-colors">
          explore
        </Link>

        {session ? (
          <>
            <Link href="/channels/new" className="hover:text-void-text transition-colors">
              + channel
            </Link>
            <div className="relative">
              <button
                onClick={() => setOpen((o) => !o)}
                className="hover:text-void-text transition-colors"
              >
                {user?.name}
              </button>
              {open && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-void-surface border border-void-border z-50">
                  <Link
                    href={`/${user?.name}`}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 text-xs hover:bg-void-raised transition-colors"
                  >
                    profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 text-xs hover:bg-void-raised transition-colors"
                  >
                    settings
                  </Link>
                  <button
                    onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }) }}
                    className="block w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-void-raised transition-colors"
                  >
                    sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-void-text transition-colors">login</Link>
            <Link href="/register" className="hover:text-void-text transition-colors">register</Link>
          </>
        )}
      </div>
    </nav>
  )
}
