import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { ChannelData } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  PUBLIC: 'open',
  CLOSED: 'closed',
  PRIVATE: 'private',
}

const STATUS_COLOR: Record<string, string> = {
  PUBLIC: 'text-void-accent',
  CLOSED: 'text-void-muted',
  PRIVATE: 'text-red-500',
}

interface Props {
  channel: ChannelData
}

export default function ChannelCard({ channel }: Props) {
  return (
    <Link
      href={`/${channel.user.username}/${channel.slug}`}
      className="card flex flex-col p-4 gap-3 hover:border-void-muted transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-void-text leading-snug line-clamp-2">
          {channel.title}
        </h3>
        <span className={`type-badge flex-shrink-0 ${STATUS_COLOR[channel.status]}`}>
          {STATUS_LABEL[channel.status]}
        </span>
      </div>

      {channel.description && (
        <p className="text-xs text-void-muted line-clamp-2 leading-relaxed">
          {channel.description}
        </p>
      )}

      <div className="flex items-center justify-between text-2xs text-void-dim mt-auto">
        <span className="text-void-muted">{channel.user.username}</span>
        <span>{channel._count?.connections ?? 0} blocks</span>
      </div>
    </Link>
  )
}
