import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export async function GET(_req: NextRequest, { params }: { params: { username: string } }) {
  const session = await getAuth()
  const requesterId = (session?.user as { id?: string })?.id

  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      id: true,
      username: true,
      bio: true,
      avatar: true,
      createdAt: true,
      channels: {
        where: {
          OR: [
            { status: 'PUBLIC' },
            { status: 'CLOSED' },
            ...(requesterId ? [{ userId: requesterId }] : []),
          ],
        },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          _count: { select: { connections: true } },
        },
        orderBy: { updatedAt: 'desc' },
      },
      _count: { select: { channels: true, blocks: true } },
    },
  })

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(user)
}

const registerSchema = z.object({
  username: z.string().min(2).max(30).regex(/^[a-z0-9_-]+$/i),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest, { params }: { params: { username: string } }) {
  // registration endpoint: POST /api/users/register
  if (params.username !== 'register') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json()
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { username, email, password } = parsed.data

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  })
  if (existing) {
    return NextResponse.json({ error: 'Username or email already taken' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { username, email, password: hashed },
    select: { id: true, username: true, email: true, createdAt: true },
  })

  return NextResponse.json(user, { status: 201 })
}
