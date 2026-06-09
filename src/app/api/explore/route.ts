import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [channels, blocks] = await Promise.all([
    prisma.channel.findMany({
      where: { status: { in: ['PUBLIC', 'CLOSED'] } },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        _count: { select: { connections: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 24,
    }),
    prisma.block.findMany({
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        _count: { select: { connections: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 24,
    }),
  ])

  return NextResponse.json({ channels, blocks })
}
