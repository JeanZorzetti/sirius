'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react'

interface AudioState {
  messageId: string | null
  src: string | null
  playing: boolean
  currentTime: number
  duration: number
  playbackRate: number
  loading: boolean
}

interface AudioPlayerContextValue extends AudioState {
  play: (messageId: string, src: string) => Promise<void>
  pause: () => void
  toggle: (messageId: string, src: string) => Promise<void>
  seek: (time: number) => void
  setPlaybackRate: (rate: number) => void
  cycleRate: () => void
  stop: () => void
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null)

const RATES = [1, 1.5, 2]

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [state, setState] = useState<AudioState>({
    messageId: null,
    src: null,
    playing: false,
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
    loading: false,
  })

  // Initialize singleton audio element on mount
  useEffect(() => {
    const a = new Audio()
    a.preload = 'metadata'
    audioRef.current = a

    const onTime = () => setState(s => ({ ...s, currentTime: a.currentTime }))
    const onDuration = () => {
      if (isFinite(a.duration) && a.duration > 0) {
        setState(s => ({ ...s, duration: a.duration }))
      }
    }
    const onEnded = () => setState(s => ({ ...s, playing: false, currentTime: 0 }))
    const onPlay = () => setState(s => ({ ...s, playing: true, loading: false }))
    const onPause = () => setState(s => ({ ...s, playing: false }))
    const onWaiting = () => setState(s => ({ ...s, loading: true }))
    const onCanPlay = () => setState(s => ({ ...s, loading: false }))

    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onDuration)
    a.addEventListener('durationchange', onDuration)
    a.addEventListener('ended', onEnded)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    a.addEventListener('waiting', onWaiting)
    a.addEventListener('canplay', onCanPlay)

    return () => {
      a.pause()
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onDuration)
      a.removeEventListener('durationchange', onDuration)
      a.removeEventListener('ended', onEnded)
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
      a.removeEventListener('waiting', onWaiting)
      a.removeEventListener('canplay', onCanPlay)
      audioRef.current = null
    }
  }, [])

  const play = useCallback(async (messageId: string, src: string) => {
    const a = audioRef.current
    if (!a) return

    // If a different message is requested, swap source
    if (a.src !== src || state.messageId !== messageId) {
      a.src = src
      a.playbackRate = state.playbackRate
      setState(s => ({
        ...s,
        messageId,
        src,
        currentTime: 0,
        duration: 0,
        loading: true,
        playing: false,
      }))
    }
    try {
      await a.play()
    } catch {
      setState(s => ({ ...s, playing: false, loading: false }))
    }
  }, [state.messageId, state.playbackRate])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const toggle = useCallback(async (messageId: string, src: string) => {
    const isCurrent = state.messageId === messageId
    if (isCurrent && state.playing) {
      pause()
    } else {
      await play(messageId, src)
    }
  }, [state.messageId, state.playing, pause, play])

  const seek = useCallback((time: number) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = Math.max(0, Math.min(time, a.duration || time))
  }, [])

  const setPlaybackRate = useCallback((rate: number) => {
    const a = audioRef.current
    if (!a) return
    a.playbackRate = rate
    setState(s => ({ ...s, playbackRate: rate }))
  }, [])

  const cycleRate = useCallback(() => {
    const next = RATES[(RATES.indexOf(state.playbackRate) + 1) % RATES.length]
    setPlaybackRate(next)
  }, [state.playbackRate, setPlaybackRate])

  const stop = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    a.pause()
    a.currentTime = 0
    setState(s => ({ ...s, messageId: null, src: null, playing: false, currentTime: 0, duration: 0 }))
  }, [])

  const value = useMemo<AudioPlayerContextValue>(() => ({
    ...state,
    play,
    pause,
    toggle,
    seek,
    setPlaybackRate,
    cycleRate,
    stop,
  }), [state, play, pause, toggle, seek, setPlaybackRate, cycleRate, stop])

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  )
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext)
  if (!ctx) throw new Error('useAudioPlayer must be used within AudioPlayerProvider')
  return ctx
}

export function useAudioPlayerForMessage(messageId: string) {
  const player = useAudioPlayer()
  const isCurrent = player.messageId === messageId
  return {
    isCurrent,
    playing: isCurrent && player.playing,
    currentTime: isCurrent ? player.currentTime : 0,
    duration: isCurrent ? player.duration : 0,
    loading: isCurrent && player.loading,
    playbackRate: player.playbackRate,
    toggle: (src: string) => player.toggle(messageId, src),
    seek: (time: number) => isCurrent && player.seek(time),
    cycleRate: player.cycleRate,
  }
}
