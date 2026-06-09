import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { randomBytes } from 'crypto'

export const config = {
  api: {
    bodyParser: false,
  },
}

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads')
const MAX_SIZE = 100 * 1024 * 1024 // 100 MB

const AUDIO_TYPES = [
  'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav',
  'audio/flac', 'audio/aac', 'audio/x-m4a', 'audio/mp4',
]
const IMAGE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml',
]
const ALLOWED_TYPES = [
  ...AUDIO_TYPES, ...IMAGE_TYPES,
  'application/pdf', 'text/plain', 'application/zip',
  'application/octet-stream',
]

const EXT_TO_TYPE: Record<string, string> = {
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.flac': 'audio/flac', '.aac': 'audio/aac', '.m4a': 'audio/x-m4a',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif',
  '.pdf': 'application/pdf', '.txt': 'text/plain', '.zip': 'application/zip',
}

function detectMime(filename: string, browserType: string): string {
  const ext = extname(filename).toLowerCase()
  return EXT_TO_TYPE[ext] || browserType || 'application/octet-stream'
}

export async function POST(req: NextRequest) {
  const session = await getAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 100 MB limit' }, { status: 413 })
  }

  const mimeType = detectMime(file.name, file.type)
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return NextResponse.json({ error: `File type not allowed: ${mimeType}` }, { status: 415 })
  }

  const category = AUDIO_TYPES.includes(mimeType)
    ? 'audio'
    : IMAGE_TYPES.includes(mimeType)
    ? 'images'
    : 'files'

  const ext = extname(file.name).toLowerCase() || '.bin'
  const id = randomBytes(12).toString('hex')
  const filename = `${id}${ext}`
  const dir = join(UPLOAD_DIR, category)

  try {
    await mkdir(dir, { recursive: true })
    const bytes = await file.arrayBuffer()
    await writeFile(join(dir, filename), Buffer.from(bytes))
  } catch (err) {
    console.error('[upload] write error:', err)
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 })
  }

  const blockType = category === 'audio' ? 'AUDIO' : category === 'images' ? 'IMAGE' : 'FILE'

  return NextResponse.json({
    fileUrl: `/api/files/${category}/${filename}`,
    fileName: file.name,
    fileMime: mimeType,
    fileSize: file.size,
    type: blockType,
  })
}
