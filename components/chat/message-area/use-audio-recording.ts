'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

/**
 * MediaRecorder lifecycle for WhatsApp-style voice notes.
 * Recording UI state lives here; what to do with the finished blob is the
 * caller's job via `onSendAudio` (gets blob + duration + actual mime type).
 */
export function useAudioRecording(
  onSendAudio: (blob: Blob, duration: number, mimeType: string) => Promise<void>
) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  // Ref mirror so recorder.onstop reads the final duration, not a stale closure
  const recordingTimeRef = useRef(0)
  useEffect(() => { recordingTimeRef.current = recordingTime }, [recordingTime])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream
      audioChunksRef.current = []

      // Prefer ogg/opus (WhatsApp PTT native format); fallback to webm
      const mimeType = MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        // Cleanup stream tracks
        stream.getTracks().forEach(t => t.stop())
        audioStreamRef.current = null
      }

      recorder.start(100) // collect in 100ms chunks
      setIsRecording(true)
      setRecordingTime(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err: unknown) {
      const name = err instanceof DOMException ? err.name : ''
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Seu browser não suporta gravação de áudio')
      } else if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        toast.error('Permissão de microfone negada. Clique no cadeado na barra de endereço e permita o microfone.')
      } else if (name === 'NotFoundError') {
        toast.error('Nenhum microfone encontrado no dispositivo')
      } else {
        toast.error('Não foi possível acessar o microfone. Verifique as permissões do browser.')
      }
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop()
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    audioChunksRef.current = []
    setIsRecording(false)
    setRecordingTime(0)
  }

  const sendRecording = async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    // Stop recording and wait for final data
    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        audioStreamRef.current?.getTracks().forEach(t => t.stop())
        audioStreamRef.current = null

        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
        setIsRecording(false)

        // Use the actual recorded mimetype so WhatsApp gets the right format
        const recordedMime = recorder.mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: recordedMime })
        audioChunksRef.current = []

        if (audioBlob.size === 0) {
          setRecordingTime(0)
          resolve()
          return
        }

        const duration = recordingTimeRef.current
        setRecordingTime(0)

        await onSendAudio(audioBlob, duration, recordedMime)
        resolve()
      }

      recorder.stop()
    })
  }

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current?.stop()
      }
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      audioStreamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  return { isRecording, recordingTime, startRecording, cancelRecording, sendRecording }
}
