'use client'
import { useState } from 'react'
import BlockCard from './BlockCard'
import type { BlockData } from '@/types'

interface Props {
  blocks: BlockData[]
  currentUserId: string | null
}

export default function ExploreBlockGrid({ blocks, currentUserId }: Props) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  const visible = blocks.filter((b) => !removedIds.has(b.id))

  async function removeBlock(blockId: string) {
    const res = await fetch(`/api/blocks/${blockId}`, { method: 'DELETE' })
    if (res.ok) setRemovedIds((prev) => new Set(Array.from(prev).concat(blockId)))
  }

  if (visible.length === 0) {
    return <p className="text-void-muted text-sm">nothing yet</p>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {visible.map((b) => (
        <BlockCard
          key={b.id}
          block={b}
          canRemove={currentUserId === b.user.id}
          onRemove={() => removeBlock(b.id)}
        />
      ))}
    </div>
  )
}
