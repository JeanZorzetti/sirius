'use client'

/**
 * Voice → Text — Sprint 4.1
 *
 * Estratégia dupla:
 * 1. Web Speech API (gratuita, on-device): Chrome desktop, Chrome Android, Safari iOS
 * 2. Fallback Groq Whisper: quando Web Speech API não disponível ou precisão crítica
 *
 * Modo push-to-talk:
 * - startRecording() → abre microfone + streaming de interimResults
 * - stopRecording()  → retorna transcript final
 *
 * Modo one-shot:
 * - transcribeAudio(blob) → envia para /api/ai/voice-command e retorna { transcript, action }
 *
 * Sem dependências extras — MediaRecorder já existe nos browsers modernos.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export interface VoiceTranscriptResult {
  transcript: string
  /** Confiança 0–1 (quando disponível via Web Speech API). */
  confidence?: number
  /** true = transcrição parcial (interim), false = final. */
  isFinal: boolean
}

export interface VoiceCommandResult {
  transcript: string
  action: VoiceAction | null
}

export type VoiceActionType =
  | 'UPDATE_DEAL_STAGE'
  | 'CREATE_NOTE'
  | 'SCHEDULE_TASK'
  | 'CALL_CONTACT'
  | 'SEND_MESSAGE'
  | 'CREATE_DEAL'
  | 'UNKNOWN'

export interface VoiceAction {
  type: VoiceActionType
  params: Record<string, unknown>
  /** Texto humanizado da ação detectada, para confirmação antes de executar. */
  description: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Detecção de suporte
// ─────────────────────────────────────────────────────────────────────────────

export function isWebSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
}

export function isMediaRecorderSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'MediaRecorder' in window && 'mediaDevices' in navigator
}

// ─────────────────────────────────────────────────────────────────────────────
// Web Speech API — push-to-talk com interimResults
// ─────────────────────────────────────────────────────────────────────────────

// Usamos `unknown` + cast interno para evitar problemas com tipos condicionais
// em `typeof window` que resolvem para `never` no contexto do compilador.
type AnyRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
  onresult:
    | ((event: {
        results: {
          [idx: number]: { isFinal: boolean; [alt: number]: { transcript: string; confidence: number } }
          length: number
        }
      }) => void)
    | null
  start(): void
  stop(): void
}

let _recognition: AnyRecognition | null = null

function getSpeechRecognition(): AnyRecognition | null {
  const w = window as unknown as Record<string, unknown>
  const Ctor = w['SpeechRecognition'] || w['webkitSpeechRecognition']
  if (!Ctor) return null
  return new (Ctor as new () => AnyRecognition)()
}

export interface VoiceRecorderOptions {
  /** Idioma BCP-47. Padrão: 'pt-BR'. */
  lang?: string
  /** Callback chamado a cada resultado (parcial ou final). */
  onResult?: (result: VoiceTranscriptResult) => void
  /** Callback quando microfone abriu. */
  onStart?: () => void
  /** Callback quando reconhecimento encerrou. */
  onEnd?: () => void
  /** Callback em caso de erro. */
  onError?: (error: string) => void
}

export class VoiceRecorder {
  private lang: string
  private onResult?: (r: VoiceTranscriptResult) => void
  private onStart?: () => void
  private onEnd?: () => void
  private onError?: (e: string) => void

  // MediaRecorder fallback
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []

  constructor(opts: VoiceRecorderOptions = {}) {
    this.lang = opts.lang ?? 'pt-BR'
    this.onResult = opts.onResult
    this.onStart = opts.onStart
    this.onEnd = opts.onEnd
    this.onError = opts.onError
  }

  start(): void {
    if (isWebSpeechSupported()) {
      this._startWebSpeech()
    } else if (isMediaRecorderSupported()) {
      void this._startMediaRecorder()
    } else {
      this.onError?.('Microfone não suportado neste dispositivo')
    }
  }

  stop(): void {
    if (_recognition) {
      _recognition.stop()
      _recognition = null
    }
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop()
    }
  }

  private _startWebSpeech(): void {
    const recognition = getSpeechRecognition()
    if (!recognition) return
    _recognition = recognition
    recognition.lang = this.lang
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.onstart = () => this.onStart?.()
    recognition.onend = () => {
      _recognition = null
      this.onEnd?.()
    }
    recognition.onerror = (e) => {
      this.onError?.(e.error)
    }
    recognition.onresult = (event) => {
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        const alt = result[0]
        this.onResult?.({
          transcript: alt.transcript,
          confidence: alt.confidence,
          isFinal: result.isFinal,
        })
      }
    }
    recognition.start()
  }

  private async _startMediaRecorder(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.audioChunks = []
      this.mediaRecorder = new MediaRecorder(stream)
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data)
      }
      this.mediaRecorder.onstart = () => this.onStart?.()
      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' })
        stream.getTracks().forEach((t) => t.stop())
        // Envia para Whisper via API
        try {
          const result = await transcribeBlob(blob, this.lang)
          this.onResult?.({ transcript: result, isFinal: true })
        } catch (err) {
          this.onError?.(err instanceof Error ? err.message : 'Erro ao transcrever')
        }
        this.onEnd?.()
      }
      this.mediaRecorder.start()
    } catch {
      this.onError?.('Permissão de microfone negada')
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Whisper fallback — via endpoint /api/ai/voice-command
// ─────────────────────────────────────────────────────────────────────────────

async function transcribeBlob(blob: Blob, lang = 'pt'): Promise<string> {
  const form = new FormData()
  form.append('audio', blob, 'recording.webm')
  form.append('lang', lang)
  form.append('mode', 'transcribe')

  const res = await fetch('/api/ai/voice-command', { method: 'POST', body: form })
  if (!res.ok) throw new Error('Erro na transcrição')
  const data = (await res.json()) as { transcript: string }
  return data.transcript
}

// ─────────────────────────────────────────────────────────────────────────────
// Intent extraction — envia transcript para classificador IA
// ─────────────────────────────────────────────────────────────────────────────

export async function extractVoiceCommand(
  transcript: string,
  context?: {
    dealId?: string
    contactId?: string
    pipelineId?: string
  },
): Promise<VoiceCommandResult> {
  try {
    const res = await fetch('/api/ai/voice-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, context, mode: 'extract_intent' }),
    })
    if (!res.ok) return { transcript, action: null }
    return (await res.json()) as VoiceCommandResult
  } catch {
    return { transcript, action: null }
  }
}
