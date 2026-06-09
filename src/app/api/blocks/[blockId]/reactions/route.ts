import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const ALLOWED_EMOJIS = ['❤️', '🔥', '✨', '👀', '💯', '🐾']

export async function GET(_req: NextRequest, { params }: { params: { blockId: string } }) {
  const session = await getAuth()
  const userId = (session?.user as { id?: string })?.id

  const block = await prisma.block.findUnique({ where: { id: params.blockId } })
  if (!block) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const reactions = await prisma.reaction.groupBy({
    by: ['emoji'],
    where: { blockId: params.blockId },
    _count: { emoji: true },
  })

  const userReactions = userId
    ? await prisma.reaction.findMany({
        where: { blockId: params.blockId, userId },
        select: { emoji: true },
      })
    : []
  const userReactionSet = new Set(userReactions.map((r) => r.emoji))

  const result = ALLOWED_EMOJIS.map((emoji) => {
    const found = reactions.find((r) => r.emoji === emoji)
    return { emoji, count: found?._count.emoji ?? 0, userReacted: userReactionSet.has(emoji) }
  })

  return NextResponse.json(result)
}

export async function POST(req: NextRequest, { params }: { params: { blockId: string } }) {
  const session = await getAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const block = await prisma.block.findUnique({ where: { id: params.blockId } })
  if (!block) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { emoji } = await req.json()
  if (!ALLOWED_EMOJIS.includes(emoji)) {
    return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 })
  }

  const existing = await prisma.reaction.findUnique({
    where: { blockId_userId_emoji: { blockId: params.blockId, userId, emoji } },
  })

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } })
  } else {
    await prisma.reaction.create({ data: { emoji, blockId: params.blockId, userId } })
  }

  return NextResponse.json({ ok: true })
}
