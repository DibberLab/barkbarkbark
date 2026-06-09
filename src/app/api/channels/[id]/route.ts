import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(['PUBLIC', 'CLOSED', 'PRIVATE']).optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth()
  const userId = (session?.user as { id?: string })?.id

  const channel = await prisma.channel.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, username: true, avatar: true } },
      _count: { select: { connections: true } },
    },
  })

  if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (channel.status === 'PRIVATE' && channel.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(channel)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const channel = await prisma.channel.findUnique({ where: { id: params.id } })
  if (!channel || channel.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updated = await prisma.channel.update({
    where: { id: params.id },
    data: parsed.data,
    include: { user: { select: { id: true, username: true, avatar: true } }, _count: { select: { connections: true } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const channel = await prisma.channel.findUnique({ where: { id: params.id } })
  if (!channel || channel.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.channel.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
