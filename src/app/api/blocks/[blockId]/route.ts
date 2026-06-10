import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: { blockId: string } }
) {
  const block = await prisma.block.findUnique({
    where: { id: params.blockId },
    include: {
      user: { select: { id: true, username: true, avatar: true } },
      _count: { select: { connections: true } },
    },
  })
  if (!block) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(block)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { blockId: string } }
) {
  const session = await getAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const block = await prisma.block.findUnique({ where: { id: params.blockId } })
  if (!block || block.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.block.delete({ where: { id: params.blockId } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { blockId: string } }
) {
  const session = await getAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const block = await prisma.block.findUnique({ where: { id: params.blockId } })
  if (!block || block.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const data: { title?: string; description?: string; content?: string } = {}
  if ('title' in body) data.title = body.title
  if ('description' in body) data.description = body.description
  if ('content' in body) data.content = body.content

  const updated = await prisma.block.update({
    where: { id: params.blockId },
    data,
    include: {
      user: { select: { id: true, username: true, avatar: true } },
      _count: { select: { connections: true } },
    },
  })

  return NextResponse.json(updated)
}
