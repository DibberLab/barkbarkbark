import slugify from 'slugify'

export function getVideoInfo(url: string): { embedUrl: string; thumbnailUrl: string } | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^(www\.|m\.)/, '')

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      let id = u.searchParams.get('v')
      if (!id && u.pathname.startsWith('/shorts/')) {
        id = u.pathname.split('/shorts/')[1]?.split('/')[0] ?? null
      }
      if (id) return {
        embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1`,
        thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      }
    }

    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0]
      if (id) return {
        embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1`,
        thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      }
    }

    if (host === 'vimeo.com') {
      const id = u.pathname.match(/^\/(\d+)/)?.[1]
      if (id) return {
        embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1`,
        thumbnailUrl: '',
      }
    }

    return null
  } catch {
    return null
  }
}

export function isImageUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase().split('?')[0]
    return /\.(jpe?g|png|gif|webp|avif|svg|bmp)$/.test(path)
  } catch {
    return /\.(jpe?g|png|gif|webp|avif|svg|bmp)$/i.test(url)
  }
}

export function extractSingleImageUrl(html: string): string | null {
  const text = html.replace(/<[^>]*>/g, '').trim()
  if (/^https?:\/\/\S+$/i.test(text) && isImageUrl(text)) return text
  const m = html.trim().match(/^<p[^>]*><a[^>]*\shref="([^"]+)"[^>]*>[^<]*<\/a><\/p>$/)
  if (m && isImageUrl(m[1])) return m[1]
  return null
}

export function extractSingleVideoInfo(html: string): { embedUrl: string; thumbnailUrl: string } | null {
  const text = html.replace(/<[^>]*>/g, '').trim()
  const candidates: string[] = []
  if (/^https?:\/\/\S+$/i.test(text)) candidates.push(text)
  const m = html.trim().match(/^<p[^>]*><a[^>]*\shref="([^"]+)"[^>]*>[^<]*<\/a><\/p>$/)
  if (m) candidates.push(m[1])
  for (const url of candidates) {
    const info = getVideoInfo(url)
    if (info) return info
  }
  return null
}

export function toSlug(text: string): string {
  return slugify(text, { lower: true, strict: true, trim: true })
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
