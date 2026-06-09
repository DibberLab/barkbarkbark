'use client'
import { useState } from 'react'
import BlockCard from './BlockCard'
import type { ConnectionData } from '@/types'

interface Props {
  connections: ConnectionData[]
  channelId: string
  isOwner: boolean
}

export default function ChannelBlockGrid({ connections, channelId, isOwner }: Props) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  const visible = connections.filter((c) => !removedIds.has(c.block.id))

  async function removeBlock(blockId: string) {
    const res = await fetch(`/api/channels/${channelId}/blocks/${blockId}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setRemovedIds((prev) => new Set(Array.from(prev).concat(blockId)))
    }
  }

  if (visible.length === 0) {
    return (
      <div className="border border-dashed border-void-border p-12 text-center">
        <p className="text-void-muted text-sm">empty channel</p>
        {isOwner && <p className="text-xs text-void-dim mt-2">add something above</p>}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {visible.map((conn) => (
        <BlockCard
          key={conn.id}
          block={conn.block}
          canRemove={isOwner}
          onRemove={() => removeBlock(conn.block.id)}
        />
      ))}
    </div>
  )
}
