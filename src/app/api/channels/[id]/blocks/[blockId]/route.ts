import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; blockId: string } }
) {
  const session = await getAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const channel = await prisma.channel.findUnique({ where: { id: params.id } })
  if (!channel || channel.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.connection.deleteMany({
    where: { channelId: params.id, blockId: params.blockId },
  })

  return NextResponse.json({ ok: true })
}
