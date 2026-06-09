'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AddBlockModal from '@/components/AddBlockModal'

interface Props {
  channelId: string
  canAdd: boolean
  isOwner: boolean
  ownerUsername: string
}

export default function ChannelControls({ channelId, canAdd, isOwner, ownerUsername }: Props) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const deleteChannel = async () => {
    if (!confirm('Delete this channel and all its connections?')) return
    setDeleting(true)
    await fetch(`/api/channels/${channelId}`, { method: 'DELETE' })
    router.push(`/${ownerUsername}`)
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-shrink-0">
        {canAdd && (
          <button className="btn-accent" onClick={() => setShowAdd(true)}>
            + add block
          </button>
        )}
        {isOwner && (
          <button className="btn-danger" onClick={deleteChannel} disabled={deleting}>
            {deleting ? '...' : 'delete'}
          </button>
        )}
      </div>
      {showAdd && (
        <AddBlockModal channelId={channelId} onClose={() => setShowAdd(false)} />
      )}
    </>
  )
}
