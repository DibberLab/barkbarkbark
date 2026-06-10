import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import SessionProvider from '@/components/SessionProvider'

export const metadata: Metadata = {
  title: 'barkbarkbark',
  description: 'channels for the obscure',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
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
