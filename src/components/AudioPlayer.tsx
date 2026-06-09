'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { formatTime } from '@/lib/utils'

interface Props {
  src: string
  title?: string | null
  fileName?: string | null
}

export default function AudioPlayer({ src, title, fileName }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(true)

  const toggle = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
    } else {
      el.play().catch(() => {})
    }
  }, [playing])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTimeUpdate = () => setCurrent(el.currentTime)
    const onLoaded = () => { setDuration(el.duration); setLoading(false) }
    const onEnded = () => setPlaying(false)

    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('loadedmetadata', onLoaded)
    el.addEventListener('ended', onEnded)

    return () => {
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('timeupdate', onTimeUpdate)
      el.removeEventListener('loadedmetadata', onLoaded)
      el.removeEventListener('ended', onEnded)
    }
  }, [])

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current
    if (!el || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    el.currentTime = pct * duration
  }

  const progress = duration ? (current / duration) * 100 : 0
  const label = title || fileName || 'audio'

  return (
    <div className="w-full">
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex flex-col gap-2 p-3 bg-void-bg border border-void-border">
        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            disabled={loading}
            className="w-7 h-7 flex items-center justify-center border border-void-border text-void-accent hover:bg-void-surface transition-colors flex-shrink-0 disabled:opacity-40"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
                <rect x="0" y="0" width="3" height="12" />
                <rect x="7" y="0" width="3" height="12" />
              </svg>
            ) : (
              <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
                <polygon points="0,0 10,6 0,12" />
              </svg>
            )}
          </button>
          <span className="text-xs text-void-muted truncate flex-1" title={label}>{label}</span>
          <span className="text-xs text-void-muted tabular-nums flex-shrink-0">
            {loading ? '--:--' : `${formatTime(current)} / ${formatTime(duration)}`}
          </span>
        </div>

        <div
          className="h-1 bg-void-border cursor-pointer relative group"
          onClick={seek}
          role="slider"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={duration}
        >
          <div
            className="h-full bg-void-accent transition-none"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-void-accent opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 4px)` }}
          />
        </div>
      </div>
    </div>
  )
}
