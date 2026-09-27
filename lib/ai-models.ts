/**
 * Groq chat models used across the product. Groq retires models without notice (llama-3.3-70b-versatile and
 * llama-3.2-1b-preview both stopped answering in 2026 and every AI feature failed with it), so the names live here
 * and can be switched through the environment without a deploy.
 */
export const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
export const GROQ_MODEL_FALLBACK = process.env.GROQ_MODEL_FALLBACK || 'openai/gpt-oss-20b'

/**
 * gpt-oss models reason before answering and the reasoning counts against max_tokens; "low" keeps short answers
 * (voice command, task summary) from coming back empty. Measured on 27/09/2026: 55 completion tokens, ~250 ms.
 */
export const GROQ_REASONING = { reasoning_effort: 'low' as const }
