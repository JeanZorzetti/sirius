/**
 * POST /api/ai/voice-command
 *
 * Dois modos via `mode` (JSON body ou FormData):
 *
 * 1. mode=transcribe  → recebe `audio` (File/Blob) como FormData,
 *    transcreve via Groq Whisper e retorna { transcript }.
 *
 * 2. mode=extract_intent  → recebe `{ transcript, context }` como JSON,
 *    classifica a intenção e retorna { transcript, action }.
 *
 * Autenticado via session cookie.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

// Lazy-init para evitar erros de build sem env var
function getGroqClient() {
  const Groq = require('groq-sdk') // eslint-disable-line @typescript-eslint/no-require-imports
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos compartilhados com lib/mobile/voice.ts
// ─────────────────────────────────────────────────────────────────────────────

type VoiceActionType =
  | 'UPDATE_DEAL_STAGE'
  | 'CREATE_NOTE'
  | 'SCHEDULE_TASK'
  | 'CALL_CONTACT'
  | 'SEND_MESSAGE'
  | 'CREATE_DEAL'
  | 'UNKNOWN'

interface VoiceAction {
  type: VoiceActionType
  params: Record<string, unknown>
  description: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Intent extraction prompt
// ─────────────────────────────────────────────────────────────────────────────

const INTENT_SYSTEM_PROMPT = `Você é um assistente de CRM. Analise o texto transcrito por voz do vendedor
e extraia a intenção estruturada. Retorne APENAS um JSON válido no formato:

{
  "type": "<tipo>",
  "params": { ...params específicos },
  "description": "<descrição humana confirmação>"
}

Tipos válidos e seus params:
- UPDATE_DEAL_STAGE: { dealName?, stageName, contactName? }
- CREATE_NOTE: { content, dealId?, contactName? }
- SCHEDULE_TASK: { title, dueDate, contactName?, dealName? }
- CALL_CONTACT: { contactName, phone? }
- SEND_MESSAGE: { contactName, message }
- CREATE_DEAL: { title, value?, contactName?, stageName? }
- UNKNOWN: { raw }

Extraia entidades como nomes de contatos, deals, estágios do pipeline, datas relativas.
Datas relativas: "sexta" = próxima sexta-feira, "amanhã" = amanhã, etc.
Responda APENAS com o JSON. Sem markdown, sem explicações.`

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.email) {
    return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY não configurada' }, { status: 503 })
  }

  const contentType = request.headers.get('content-type') ?? ''

  // ── Modo transcrição (FormData com arquivo de áudio) ──────────────────────
  if (contentType.includes('multipart/form-data')) {
    try {
      const form = await request.formData()
      const audio = form.get('audio') as File | null
      const lang = (form.get('lang') as string) || 'pt'

      if (!audio) {
        return NextResponse.json({ error: 'Campo audio obrigatório' }, { status: 400 })
      }

      const groq = getGroqClient()

      const transcription = await groq.audio.transcriptions.create({
        file: audio,
        model: 'whisper-large-v3-turbo',
        language: lang.split('-')[0], // 'pt-BR' → 'pt'
        response_format: 'json',
      })

      return NextResponse.json({ transcript: transcription.text ?? '' })
    } catch (err) {
      console.error('[voice-command] transcribe error:', err)
      return NextResponse.json({ error: 'Erro na transcrição' }, { status: 500 })
    }
  }

  // ── Modo extração de intent (JSON) ────────────────────────────────────────
  try {
    const body = (await request.json()) as {
      transcript: string
      context?: { dealId?: string; contactId?: string; pipelineId?: string }
      mode?: string
    }

    const { transcript, context } = body

    if (!transcript?.trim()) {
      return NextResponse.json({ error: 'transcript obrigatório' }, { status: 400 })
    }

    const groq = getGroqClient()

    const contextHint = context
      ? `\nContexto atual: ${JSON.stringify(context)}`
      : ''

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 256,
      messages: [
        { role: 'system', content: INTENT_SYSTEM_PROMPT + contextHint },
        { role: 'user', content: transcript },
      ],
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    let action: VoiceAction | null = null
    try {
      action = JSON.parse(raw) as VoiceAction
      if (action.type === 'UNKNOWN') action = null
    } catch {
      action = null
    }

    return NextResponse.json({ transcript, action })
  } catch (err) {
    console.error('[voice-command] intent error:', err)
    return await apiError(ERR.INTERNAL_ERROR, 500)
  }
}
