import { fetchPublico, EnderecoNaoPermitido } from '@/lib/url-publica'
import { FalhaIntegrador, RecusaIntegrador, type Adaptador, type Credenciais, type Provider, type TipoMidia } from './tipos'
import { zapi } from './zapi'
import { uazapi } from './uazapi'
import { evolution } from './evolution'

export function adaptador(provider: Provider): Adaptador {
  switch (provider) {
    case 'ZAPI':
      return zapi
    case 'UAZAPI':
      return uazapi
    case 'EVOLUTION':
      return evolution
  }
}

/** Narrows the credentials to the adapter's integrator; a mismatch is a bug, never user input. */
export function credenciaisDe<P extends Provider>(c: Credenciais, provider: P): Extract<Credenciais, { provider: P }> {
  if (c.provider !== provider) throw new Error(`credenciais de ${c.provider} passadas para ${provider}`)
  return c as Extract<Credenciais, { provider: P }>
}

/** Text shown for a media message, like the official route: the caption, the file name or a label. */
export function textoDaMidia(tipo: TipoMidia | 'sticker', legenda?: string | null, nomeArquivo?: string | null): string {
  if (tipo === 'image') return legenda || '[Imagem]'
  if (tipo === 'video') return legenda || '[Vídeo]'
  if (tipo === 'audio') return '[Áudio]'
  if (tipo === 'document') return nomeArquivo || legenda || '[Documento]'
  return '[Figurinha]'
}

/** WhatsApp timestamps arrive in seconds or milliseconds, as number or string. */
export function quando(valor: unknown): Date {
  const n = Number(typeof valor === 'object' && valor !== null ? (valor as { low?: number }).low : valor)
  if (!Number.isFinite(n) || n <= 0) return new Date()
  return new Date(n < 1e12 ? n * 1000 : n)
}

export function extensaoDe(mimetype: string, nomeArquivo?: string): string {
  const doNome = nomeArquivo?.includes('.') ? nomeArquivo.split('.').pop() : undefined
  return (doNome || mimetype.split(';')[0].split('/')[1] || 'bin').toLowerCase()
}

const TEMPO_LIMITE_MS = 10_000

/**
 * Every outbound call to an integrator: public HTTPS only, 10 s timeout. 401 and 403 become RecusaIntegrador naming
 * `campo`; other errors become FalhaIntegrador. Never logs the body or the auth header, which carry the credentials.
 */
export async function chamarIntegrador(url: string, init: RequestInit = {}, campo = 'token'): Promise<Response> {
  let resposta: Response
  try {
    resposta = await fetchPublico(url, { ...init, signal: AbortSignal.timeout(TEMPO_LIMITE_MS) }, { exigirHttps: true })
  } catch (erro) {
    if (erro instanceof EnderecoNaoPermitido) throw erro
    const nome = (erro as Error)?.name
    throw new FalhaIntegrador(nome === 'TimeoutError' || nome === 'AbortError' ? 'o integrador não respondeu em 10 s' : 'sem resposta do integrador')
  }
  if (resposta.status === 401 || resposta.status === 403) {
    throw new RecusaIntegrador(campo, `o integrador recusou a credencial (${resposta.status})`)
  }
  if (!resposta.ok) throw new FalhaIntegrador(`o integrador respondeu ${resposta.status}`, resposta.status)
  return resposta
}

export async function chamarJson<T = any>(url: string, init: RequestInit = {}, campo = 'token'): Promise<T> {
  const resposta = await chamarIntegrador(url, init, campo)
  return (await resposta.json().catch(() => ({}))) as T
}

export const corpoJson = (dados: unknown, cabecalhos: Record<string, string> = {}): RequestInit => ({
  body: JSON.stringify(dados),
  headers: { 'content-type': 'application/json', ...cabecalhos },
})
