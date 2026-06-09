import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const updateSchema = z.object({
  bio: z.string().max(300).nullable().optional(),
  newPassword: z.string().min(8).optional(),
  currentPassword: z.string().optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await getAuth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { bio, newPassword, currentPassword } = parsed.data
  const data: Record<string, unknown> = {}

  if (bio !== undefined) data.bio = bio

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password required' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return NextResponse.json({ error: 'Wrong current password' }, { status: 400 })
    data.password = await bcrypt.hash(newPassword, 12)
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, username: true, email: true, bio: true, avatar: true },
  })

  return NextResponse.json(updated)
}
