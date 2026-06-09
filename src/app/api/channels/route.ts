import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { toSlug } from '@/lib/utils'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  status: z.enum(['PUBLIC', 'CLOSED', 'PRIVATE']).default('CLOSED'),
})

export async function GET(req: NextRequest) {
  const session = await getAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const channels = await prisma.channel.findMany({
    where: { userId },
    include: { user: { select: { id: true, username: true, avatar: true } }, _count: { select: { connections: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(channels)
}

export async function POST(req: NextRequest) {
  const session = await getAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { title, description, status } = parsed.data
  let slug = toSlug(title)

  // ensure unique slug per user
  const existing = await prisma.channel.findUnique({ where: { userId_slug: { userId, slug } } })
  if (existing) slug = `${slug}-${Date.now()}`

  const channel = await prisma.channel.create({
    data: { title, slug, description, status, userId },
    include: { user: { select: { id: true, username: true, avatar: true } }, _count: { select: { connections: true } } },
  })

  return NextResponse.json(channel, { status: 201 })
}
