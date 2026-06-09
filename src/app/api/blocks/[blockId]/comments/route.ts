import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { blockId: string } }) {
  const block = await prisma.block.findUnique({ where: { id: params.blockId } })
  if (!block) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const comments = await prisma.comment.findMany({
    where: { blockId: params.blockId },
    include: { user: { select: { id: true, username: true, avatar: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(comments)
}

export async function POST(req: NextRequest, { params }: { params: { blockId: string } }) {
  const session = await getAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const block = await prisma.block.findUnique({ where: { id: params.blockId } })
  if (!block) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { body } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Comment body required' }, { status: 400 })

  const comment = await prisma.comment.create({
    data: { body: body.trim(), blockId: params.blockId, userId },
    include: { user: { select: { id: true, username: true, avatar: true } } },
  })

  return NextResponse.json(comment, { status: 201 })
}
