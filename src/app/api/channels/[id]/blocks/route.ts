import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const blockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('TEXT'), content: z.string().min(1) }),
  z.object({ type: z.literal('LINK'), source: z.string().url(), title: z.string().optional(), description: z.string().optional() }),
  z.object({ type: z.literal('IMAGE'), fileUrl: z.string(), fileName: z.string(), fileMime: z.string(), fileSize: z.number(), title: z.string().optional() }),
  z.object({ type: z.literal('AUDIO'), fileUrl: z.string(), fileName: z.string(), fileMime: z.string(), fileSize: z.number(), title: z.string().optional() }),
  z.object({ type: z.literal('FILE'), fileUrl: z.string(), fileName: z.string(), fileMime: z.string(), fileSize: z.number(), title: z.string().optional() }),
])

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth()
  const userId = (session?.user as { id?: string })?.id

  const channel = await prisma.channel.findUnique({ where: { id: params.id } })
  if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (channel.status === 'PRIVATE' && channel.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const connections = await prisma.connection.findMany({
    where: { channelId: params.id },
    include: {
      block: {
        include: { user: { select: { id: true, username: true, avatar: true } } },
      },
      user: { select: { id: true, username: true, avatar: true } },
    },
    orderBy: { position: 'asc' },
  })

  return NextResponse.json(connections)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const channel = await prisma.channel.findUnique({ where: { id: params.id } })
  if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // only owner can add to CLOSED channels
  if (channel.status === 'CLOSED' && channel.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (channel.status === 'PRIVATE' && channel.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  // connecting an existing block
  if (body.blockId) {
    const block = await prisma.block.findUnique({ where: { id: body.blockId } })
    if (!block) return NextResponse.json({ error: 'Block not found' }, { status: 404 })

    const maxPos = await prisma.connection.aggregate({
      where: { channelId: params.id },
      _max: { position: true },
    })

    const connection = await prisma.connection.create({
      data: {
        blockId: block.id,
        channelId: params.id,
        userId,
        position: (maxPos._max.position ?? -1) + 1,
      },
      include: {
        block: { include: { user: { select: { id: true, username: true, avatar: true } } } },
        user: { select: { id: true, username: true, avatar: true } },
      },
    })
    return NextResponse.json(connection, { status: 201 })
  }

  const parsed = blockSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const maxPos = await prisma.connection.aggregate({
    where: { channelId: params.id },
    _max: { position: true },
  })

  const [block, connection] = await prisma.$transaction(async (tx) => {
    const b = await tx.block.create({ data: { ...parsed.data, userId } })
    const c = await tx.connection.create({
      data: {
        blockId: b.id,
        channelId: params.id,
        userId,
        position: (maxPos._max.position ?? -1) + 1,
      },
      include: {
        block: { include: { user: { select: { id: true, username: true, avatar: true } } } },
        user: { select: { id: true, username: true, avatar: true } },
      },
    })
    return [b, c] as const
  })
  void block

  return NextResponse.json(connection, { status: 201 })
}
