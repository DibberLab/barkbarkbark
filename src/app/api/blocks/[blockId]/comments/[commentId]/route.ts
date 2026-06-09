import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { blockId: string; commentId: string } }
) {
  const session = await getAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const comment = await prisma.comment.findUnique({ where: { id: params.commentId } })
  if (!comment || comment.blockId !== params.blockId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (comment.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.comment.delete({ where: { id: params.commentId } })
  return new NextResponse(null, { status: 204 })
}
