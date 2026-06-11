'use client'

import { Loader2, Mic, Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAudioPlayerForMessage } from '@/hooks/use-audio-player'
import { fmtAudioTime, fmtDuration, isMediaLoaded } from './utils'

export function AudioPlayer({
  messageId, mediaData, outbound, loading, onFetch, containerRef, knownDuration, error,
}: {
  messageId: string
  mediaData: string | null
  outbound: boolean
  loading: boolean
  onFetch: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
  knownDuration?: number
  error?: boolean
}) {
  const player = useAudioPlayerForMessage(messageId)
  const playing = player.playing
  const currentTime = player.currentTime
  const duration = player.isCurrent && player.duration > 0
    ? player.duration
    : (knownDuration ?? 0)
  const playbackRate = player.playbackRate

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  async function togglePlay() {
    if (!mediaData) return
    await player.toggle(mediaData)
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    if (!duration || !player.isCurrent) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    player.seek(pct * duration)
  }

  function cycleSpeed() {
    player.cycleRate()
  }

  const bg = outbound ? 'bg-[#d9fdd3] dark:bg-emerald-900/60' : 'bg-white dark:bg-zinc-800'
  const waveColor = outbound ? '#4acd8d' : '#8696a0'
  const progressColor = '#00a884'

  if (!isMediaLoaded(mediaData)) {
    // Sent audio (WABA outbound) — no playback URL available, show duration badge only
    if (error) {
      return (
        <div ref={containerRef}>
          <div className={cn('flex items-center gap-2.5 rounded-2xl px-3 py-2.5', bg)}>
            <div className="w-10 h-10 rounded-full bg-[#00a884]/20 flex items-center justify-center flex-shrink-0">
              <Mic className="h-5 w-5 text-[#00a884]" />
            </div>
            <span className="text-[13px] text-[#667781]">
              {knownDuration ? fmtDuration(knownDuration) : 'Áudio enviado'}
            </span>
          </div>
        </div>
      )
    }

    return (
      <div ref={containerRef}>
        <div className={cn('flex items-center gap-3 rounded-2xl px-3 py-2.5 min-w-[220px]', bg)}>
          <button
            onClick={onFetch}
            disabled={loading}
            className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center flex-shrink-0 hover:bg-[#008f72] transition-colors disabled:opacity-60"
          >
            {loading
              ? <Loader2 className="h-5 w-5 animate-spin text-white" />
              : <Play className="h-5 w-5 text-white fill-white ml-0.5" />}
          </button>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-[2px] h-6">
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[2px] rounded-full"
                  style={{
                    height: `${6 + Math.abs(Math.sin(i * 0.8)) * 14}px`,
                    backgroundColor: waveColor,
                    opacity: 0.5,
                  }}
                />
              ))}
            </div>
            <span className="text-[11px] text-[#667781]">0:00</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef}>
      <div className={cn('flex items-center gap-3 rounded-2xl px-3 py-2.5 min-w-[220px] max-w-[280px]', bg)}>
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center flex-shrink-0 hover:bg-[#008f72] transition-colors"
        >
          {playing
            ? <Pause className="h-5 w-5 text-white fill-white" />
            : <Play className="h-5 w-5 text-white fill-white ml-0.5" />}
        </button>

        <div className="flex-1 space-y-1.5 min-w-0">
          {/* Waveform / seekbar */}
          <div
            className="relative h-6 flex items-center cursor-pointer"
            onClick={seekTo}
          >
            {/* Static waveform bars */}
            <div className="absolute inset-0 flex items-center gap-[2px]">
              {Array.from({ length: 28 }).map((_, i) => {
                const barH = 6 + Math.abs(Math.sin(i * 0.8)) * 14
                const filled = (i / 28) * 100 <= progress
                return (
                  <div
                    key={i}
                    className="w-[2px] rounded-full flex-shrink-0 transition-colors duration-100"
                    style={{
                      height: `${barH}px`,
                      backgroundColor: filled ? progressColor : waveColor,
                      opacity: filled ? 1 : 0.45,
                    }}
                  />
                )
              })}
            </div>
          </div>

          {/* Time + speed */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#667781] tabular-nums">
              {playing || currentTime > 0 ? fmtAudioTime(currentTime) : fmtAudioTime(duration)}
            </span>
            <button
              onClick={cycleSpeed}
              className="text-[11px] font-semibold text-[#667781] hover:text-[#00a884] transition-colors px-1"
            >
              {playbackRate}×
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
