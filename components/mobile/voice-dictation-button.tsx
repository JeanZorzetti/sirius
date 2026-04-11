'use client'

/**
 * VoiceDictationButton — Sprint 4.1
 *
 * Botão flutuante de microfone push-to-talk. Aparece apenas em mobile (lg:hidden).
 * Modo de uso:
 *   1. Pressionar e segurar → grava voz
 *   2. Soltar → transcreve e extrai intent
 *   3. Modal de confirmação mostra a ação detectada antes de executar
 *
 * Integrado em deals, contatos e chat via `context` prop.
 */

import * as React from 'react'
import { Mic, MicOff, Loader2, Check, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hapticImpact, hapticSuccess, hapticWarning } from '@/lib/mobile/haptics'
import {
  VoiceRecorder,
  extractVoiceCommand,
  isWebSpeechSupported,
  isMediaRecorderSupported,
  type VoiceCommandResult,
} from '@/lib/mobile/voice'

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface VoiceDictationButtonProps {
  /** Contexto para a extração de intent. */
  context?: {
    dealId?: string
    contactId?: string
    pipelineId?: string
  }
  /**
   * Chamado com o transcript final (e possível action) quando o usuário
   * confirma. O caller decide o que fazer com a ação (ex: chamar API).
   */
  onResult?: (result: VoiceCommandResult) => void
  /**
   * Classe extra para posicionamento. Default: fixed bottom-right acima do
   * bottom nav.
   */
  className?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

type State = 'idle' | 'recording' | 'processing' | 'confirming' | 'error'

export function VoiceDictationButton({ context, onResult, className }: VoiceDictationButtonProps) {
  const [state, setState] = React.useState<State>('idle')
  const [interimText, setInterimText] = React.useState('')
  const [result, setResult] = React.useState<VoiceCommandResult | null>(null)
  const [errorMsg, setErrorMsg] = React.useState('')
  const recorderRef = React.useRef<VoiceRecorder | null>(null)

  const isSupported = React.useMemo(
    () => isWebSpeechSupported() || isMediaRecorderSupported(),
    [],
  )

  // Não renderiza se microfone não disponível
  if (!isSupported) return null

  function handlePressStart() {
    if (state !== 'idle') return
    void hapticImpact('medium')
    setState('recording')
    setInterimText('')
    setResult(null)

    const recorder = new VoiceRecorder({
      lang: 'pt-BR',
      onResult: (r) => {
        setInterimText(r.transcript)
        if (r.isFinal) {
          void handleFinalTranscript(r.transcript)
        }
      },
      onError: (err) => {
        void hapticWarning()
        setErrorMsg(err === 'not-allowed' ? 'Permissão de microfone negada' : `Erro: ${err}`)
        setState('error')
      },
    })
    recorderRef.current = recorder
    recorder.start()
  }

  function handlePressEnd() {
    if (state !== 'recording') return
    recorderRef.current?.stop()
    // Web Speech API dispara isFinal → handleFinalTranscript
    // MediaRecorder processa no onstop do recorder
    if (!isWebSpeechSupported()) {
      setState('processing')
    }
  }

  async function handleFinalTranscript(transcript: string) {
    setState('processing')
    try {
      const cmdResult = await extractVoiceCommand(transcript, context)
      void hapticSuccess()
      setResult(cmdResult)
      setState('confirming')
    } catch {
      setState('confirming')
      setResult({ transcript, action: null })
    }
  }

  function handleConfirm() {
    if (result) {
      onResult?.(result)
      void hapticSuccess()
    }
    setState('idle')
    setInterimText('')
    setResult(null)
  }

  function handleCancel() {
    recorderRef.current?.stop()
    setState('idle')
    setInterimText('')
    setResult(null)
    setErrorMsg('')
  }

  return (
    <>
      {/* Botão flutuante — acima do bottom nav */}
      <button
        type="button"
        aria-label={state === 'recording' ? 'Parar gravação' : 'Ditar nota por voz'}
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onPointerLeave={handlePressEnd}
        className={cn(
          'fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] right-4 z-40',
          'flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200',
          'touch-target lg:hidden',
          state === 'recording'
            ? 'scale-110 bg-red-500 text-white ring-4 ring-red-300 dark:ring-red-800'
            : state === 'processing'
              ? 'bg-violet-600 text-white'
              : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white hover:shadow-xl hover:scale-105 active:scale-95',
          className,
        )}
      >
        {state === 'recording' ? (
          <MicOff className="h-5 w-5" />
        ) : state === 'processing' ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </button>

      {/* Overlay de transcrição ao vivo */}
      {(state === 'recording' || state === 'processing') && interimText && (
        <div
          className={cn(
            'fixed inset-x-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+4.5rem)] z-40 lg:hidden',
            'rounded-2xl border border-border/60 bg-background/95 px-4 py-3 text-sm shadow-xl backdrop-blur-md',
          )}
        >
          <p className="text-muted-foreground">{interimText}</p>
        </div>
      )}

      {/* Modal de confirmação */}
      {state === 'confirming' && result && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCancel}
          />
          {/* Sheet */}
          <div className="relative w-full rounded-t-2xl border-t border-border bg-background pb-[env(safe-area-inset-bottom)] shadow-2xl">
            {/* Drag handle */}
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-border" />

            <div className="px-5 py-4">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-violet-600" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Comando detectado
                </span>
              </div>

              {/* Transcript */}
              <p className="mb-3 rounded-xl bg-muted/50 px-3 py-2 text-sm text-foreground">
                "{result.transcript}"
              </p>

              {/* Ação inferida */}
              {result.action ? (
                <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50/60 px-3 py-2 text-sm dark:border-violet-800 dark:bg-violet-950/30">
                  <span className="font-medium text-violet-700 dark:text-violet-300">
                    {result.action.description}
                  </span>
                </div>
              ) : (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-sm dark:border-amber-800 dark:bg-amber-950/30">
                  <span className="text-amber-700 dark:text-amber-300">
                    Nenhuma ação específica detectada. O texto será salvo como nota.
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted active:scale-[0.98]"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-700 active:scale-[0.98]"
                >
                  <Check className="h-4 w-4" />
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Erro */}
      {state === 'error' && (
        <div className="fixed inset-x-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+4.5rem)] z-40 lg:hidden">
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50/95 px-4 py-3 text-sm shadow-lg dark:border-red-800 dark:bg-red-950/80">
            <MicOff className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <span className="text-red-800 dark:text-red-200">{errorMsg}</span>
            <button
              type="button"
              onClick={handleCancel}
              className="ml-auto shrink-0 text-red-600 hover:text-red-800 dark:text-red-400"
              aria-label="Fechar erro"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
