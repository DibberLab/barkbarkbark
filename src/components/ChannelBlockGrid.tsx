'use client'
import { useState, useCallback } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext, rectSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import BlockCard from './BlockCard'
import GhostBlock from './GhostBlock'
import type { ConnectionData, BlockData } from '@/types'

type SortKey = 'position' | 'newest' | 'oldest' | 'type' | 'title'
type FilterType = 'ALL' | 'TEXT' | 'LINK' | 'IMAGE' | 'AUDIO' | 'FILE'

interface Props {
  connections: ConnectionData[]
  channelId: string
  isOwner: boolean
  canAdd: boolean
}

function SortableCard({
  conn, isOwner, onRemove,
}: {
  conn: ConnectionData
  isOwner: boolean
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: conn.block.id })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <BlockCard block={conn.block} canRemove={isOwner} onRemove={onRemove} />
    </div>
  )
}

const FILTER_TYPES: FilterType[] = ['ALL', 'TEXT', 'LINK', 'IMAGE', 'AUDIO', 'FILE']

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'position', label: 'custom' },
  { key: 'newest', label: 'newest' },
  { key: 'oldest', label: 'oldest' },
  { key: 'type', label: 'type' },
  { key: 'title', label: 'title' },
]

export default function ChannelBlockGrid({ connections, channelId, isOwner, canAdd }: Props) {
  const [items, setItems] = useState<ConnectionData[]>(connections)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<SortKey>('position')
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const canDrag = isOwner && sort === 'position' && filter === 'ALL'

  const visible = items
    .filter((c) => !removedIds.has(c.block.id))
    .filter((c) => filter === 'ALL' || c.block.type === filter)
    .sort((a, b) => {
      if (sort === 'position') return 0
      if (sort === 'newest') return new Date(b.block.createdAt).getTime() - new Date(a.block.createdAt).getTime()
      if (sort === 'oldest') return new Date(a.block.createdAt).getTime() - new Date(b.block.createdAt).getTime()
      if (sort === 'type') return a.block.type.localeCompare(b.block.type)
      if (sort === 'title') return (a.block.title ?? '').localeCompare(b.block.title ?? '')
      return 0
    })

  function handleAdd(conn: ConnectionData) {
    setItems((prev) => [...prev, conn])
  }

  async function removeBlock(blockId: string) {
    const res = await fetch(`/api/channels/${channelId}/blocks/${blockId}`, { method: 'DELETE' })
    if (res.ok) setRemovedIds((prev) => new Set(Array.from(prev).concat(blockId)))
  }

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(e.active.id as string)
  }, [])

  const handleDragEnd = useCallback(async (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over || active.id === over.id) return

    setItems((prev) => {
      const oldIndex = prev.findIndex((c) => c.block.id === active.id)
      const newIndex = prev.findIndex((c) => c.block.id === over.id)
      const next = arrayMove(prev, oldIndex, newIndex)
      const order = next.filter((c) => !removedIds.has(c.block.id)).map((c) => c.block.id)
      fetch(`/api/channels/${channelId}/blocks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      })
      return next
    })
  }, [channelId, removedIds])

  const activeConn = activeId ? items.find((c) => c.block.id === activeId) : null

  const showControls = connections.length > 1 || filter !== 'ALL'

  if (visible.length === 0 && !canAdd) {
    return <div className="border border-dashed border-void-border p-12 text-center"><p className="text-void-muted text-sm">empty channel</p></div>
  }

  return (
    <div className="flex flex-col gap-4">
      {showControls && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {/* filter */}
          <div className="flex items-center gap-1.5">
            {FILTER_TYPES.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-2xs uppercase tracking-widest px-2 py-0.5 border transition-colors ${
                  filter === f
                    ? 'border-void-muted text-void-text'
                    : 'border-transparent text-void-dim hover:text-void-muted'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* sort */}
          <div className="flex items-center gap-1.5">
            <span className="text-2xs text-void-dim uppercase tracking-widest">sort</span>
            {SORT_OPTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={`text-2xs uppercase tracking-widest px-2 py-0.5 border transition-colors ${
                  sort === s.key
                    ? 'border-void-muted text-void-text'
                    : 'border-transparent text-void-dim hover:text-void-muted'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visible.map((c) => c.block.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {visible.map((conn) =>
              canDrag ? (
                <SortableCard
                  key={conn.id}
                  conn={conn}
                  isOwner={isOwner}
                  onRemove={() => removeBlock(conn.block.id)}
                />
              ) : (
                <BlockCard
                  key={conn.id}
                  block={conn.block}
                  canRemove={isOwner}
                  onRemove={() => removeBlock(conn.block.id)}
                />
              )
            )}
            {canAdd && <GhostBlock channelId={channelId} onAdd={handleAdd} />}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeConn && (
            <div style={{ opacity: 0.85, cursor: 'grabbing' }}>
              <BlockCard block={activeConn.block as unknown as BlockData} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
