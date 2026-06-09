import { NextRequest, NextResponse } from 'next/server'
import { createReadStream, existsSync } from 'fs'
import { stat } from 'fs/promises'
import { join, extname } from 'path'
import { Readable } from 'stream'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads')

const EXT_MIME: Record<string, string> = {
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.flac': 'audio/flac', '.aac': 'audio/aac', '.m4a': 'audio/x-m4a',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
  '.svg': 'image/svg+xml', '.pdf': 'application/pdf',
  '.txt': 'text/plain', '.zip': 'application/zip',
}

function getMime(filename: string): string {
  return EXT_MIME[extname(filename).toLowerCase()] ?? 'application/octet-stream'
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // strip any path traversal attempts
  const safePath = params.path.map((p) => p.replace(/\.\./g, '')).join('/')
  const filePath = join(UPLOAD_DIR, safePath)

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const stats = await stat(filePath)
  const mimeType = getMime(filePath)

  const range = req.headers.get('range')
  if (range && mimeType.startsWith('audio/')) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1
    const chunkSize = end - start + 1

    const nodeStream = createReadStream(filePath, { start, end })
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk))
        nodeStream.on('end', () => controller.close())
        nodeStream.on('error', (e) => controller.error(e))
      },
      cancel() { nodeStream.destroy() },
    })

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': mimeType,
      },
    })
  }

  const nodeStream = createReadStream(filePath)
  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk) => controller.enqueue(chunk))
      nodeStream.on('end', () => controller.close())
      nodeStream.on('error', (e) => controller.error(e))
    },
    cancel() { nodeStream.destroy() },
  })

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(stats.size),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Accept-Ranges': 'bytes',
    },
  })
}
