import type { BlockType, ChannelStatus } from '@prisma/client'

export type { BlockType, ChannelStatus }

export interface UserSummary {
  id: string
  username: string
  avatar: string | null
}

export interface BlockData {
  id: string
  type: BlockType
  content: string | null
  title: string | null
  description: string | null
  source: string | null
  fileUrl: string | null
  fileName: string | null
  fileMime: string | null
  fileSize: number | null
  user: UserSummary
  createdAt: string
  updatedAt: string
  _count?: { connections: number }
}

export interface ChannelData {
  id: string
  title: string
  slug: string
  description: string | null
  status: ChannelStatus
  user: UserSummary
  createdAt: string
  updatedAt: string
  _count?: { connections: number }
}

export interface ConnectionData {
  id: string
  position: number
  createdAt: string
  block: BlockData
  user: UserSummary
}

export interface CommentData {
  id: string
  body: string
  user: UserSummary
  createdAt: string
  updatedAt: string
}

export interface ReactionSummary {
  emoji: string
  count: number
  userReacted: boolean
}
