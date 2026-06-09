import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import SessionProvider from '@/components/SessionProvider'

export const metadata: Metadata = {
  title: 'VOID',
  description: 'channels for the obscure',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <Nav />
          <main className="pt-10 min-h-screen">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  )
}
