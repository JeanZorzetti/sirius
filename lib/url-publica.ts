import dns, { type LookupAddress } from 'dns'
import { isIP } from 'net'
import { Agent, fetch as fetchUndici } from 'undici'

/**
 * Outbound calls to an address the account typed (automation webhooks, n8n, Evolution, the prospecting crawler) may only
 * reach the public internet. The check runs at connection time (custom DNS lookup), so a host that resolves to a public
 * IP when validated and to 127.0.0.1 when connecting (DNS rebinding) is still refused.
 */

const V4_BLOQUEADAS: [string, number][] = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
  ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
]

const v4ParaNumero = (ip: string) => ip.split('.').reduce((n, parte) => n * 256 + Number(parte), 0)

function v4Publico(ip: string): boolean {
  const n = v4ParaNumero(ip)
  return !V4_BLOQUEADAS.some(([rede, bits]) => {
    const tamanho = 2 ** (32 - bits)
    const inicio = v4ParaNumero(rede)
    return n >= inicio && n < inicio + tamanho
  })
}

/** Expands an IPv6 literal into its 8 groups (numbers). */
function gruposV6(ip: string): number[] {
  let texto = ip.toLowerCase()
  const v4Final = texto.match(/(\d+\.\d+\.\d+\.\d+)$/)
  if (v4Final) {
    const n = v4ParaNumero(v4Final[1])
    texto = texto.slice(0, -v4Final[1].length) + `${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`
  }
  const [cabeca, cauda] = texto.split('::')
  const a = cabeca ? cabeca.split(':') : []
  const b = cauda !== undefined && cauda !== '' ? cauda.split(':') : []
  const zeros = texto.includes('::') ? Array(8 - a.length - b.length).fill('0') : []
  return [...a, ...zeros, ...b].map((g) => parseInt(g, 16))
}

export function ipPublico(ip: string): boolean {
  const versao = isIP(ip)
  if (versao === 4) return v4Publico(ip)
  if (versao !== 6) return false
  const g = gruposV6(ip)
  const tudoZeroAte = (i: number) => g.slice(0, i).every((x) => x === 0)
  // ::ffff:a.b.c.d (mapped) and ::a.b.c.d (compat): judge the embedded IPv4
  if (tudoZeroAte(5) && (g[5] === 0xffff || g[5] === 0)) {
    if (g[6] === 0 && g[7] <= 1 && g[5] === 0) return false // :: and ::1
    return v4Publico(`${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`)
  }
  if (g[0] === 0x64 && g[1] === 0xff9b) return v4Publico(`${g[6] >> 8}.${g[6] & 255}.${g[7] >> 8}.${g[7] & 255}`) // NAT64
  if ((g[0] & 0xfe00) === 0xfc00) return false // fc00::/7 unique local
  if ((g[0] & 0xffc0) === 0xfe80) return false // fe80::/10 link-local
  if ((g[0] & 0xff00) === 0xff00) return false // multicast
  if (g[0] === 0x2001 && g[1] === 0x0db8) return false // documentation
  return true
}

export class EnderecoNaoPermitido extends Error {
  constructor(motivo: string) {
    super(`endereço não permitido: ${motivo}`)
    this.name = 'EnderecoNaoPermitido'
  }
}

/** Validates scheme and literal IPs. Hostnames are judged later, at connection time. */
export function garantirUrlPublica(url: string, { exigirHttps = false } = {}): URL {
  let alvo: URL
  try {
    alvo = new URL(url)
  } catch {
    throw new EnderecoNaoPermitido('URL inválida')
  }
  if (alvo.protocol !== 'https:' && (exigirHttps || alvo.protocol !== 'http:')) {
    throw new EnderecoNaoPermitido(exigirHttps ? 'use https' : `protocolo ${alvo.protocol}`)
  }
  const host = alvo.hostname.replace(/^\[|\]$/g, '')
  if (isIP(host) && !ipPublico(host)) throw new EnderecoNaoPermitido(`${host} não é público`)
  return alvo
}

function lookupPublico(
  hostname: string,
  opcoes: dns.LookupOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void,
) {
  dns.lookup(hostname, { ...opcoes, all: true }, (err, enderecos) => {
    if (err) return callback(err, '')
    const lista = enderecos as LookupAddress[]
    const interno = lista.find((e) => !ipPublico(e.address))
    if (interno || lista.length === 0) {
      return callback(new EnderecoNaoPermitido(`${hostname} resolve para ${interno?.address ?? 'nada'}`), '')
    }
    if (opcoes.all) return callback(null, lista)
    callback(null, lista[0].address, lista[0].family)
  })
}

const agente = new Agent({ connect: { lookup: lookupPublico as never } })

const MAX_REDIRECIONAMENTOS = 5

/**
 * `fetch` for addresses the account configured. Redirects are followed by hand so every hop is re-checked
 * (a literal-IP hop would skip the DNS lookup).
 */
export async function fetchPublico(url: string, init: RequestInit = {}, opcoes: { exigirHttps?: boolean } = {}): Promise<Response> {
  let atual = url
  let pedido: RequestInit = init
  for (let salto = 0; salto <= MAX_REDIRECIONAMENTOS; salto++) {
    const alvo = garantirUrlPublica(atual, opcoes)
    const resposta = await fetchUndici(alvo, { ...(pedido as object), redirect: 'manual', dispatcher: agente } as never).catch(
      (erro: Error & { cause?: unknown }) => {
        // the connection-time refusal arrives as "fetch failed"; surface the real reason
        throw erro.cause instanceof EnderecoNaoPermitido ? erro.cause : erro
      },
    )
    const destino = resposta.headers.get('location')
    if (resposta.status >= 300 && resposta.status < 400 && destino) {
      atual = new URL(destino, alvo).toString()
      // 301/302/303 turn a POST into a GET without body, as browsers do; 307/308 repeat the request
      if (resposta.status === 303 || ((resposta.status === 301 || resposta.status === 302) && pedido.method && pedido.method !== 'GET')) {
        pedido = { ...pedido, method: 'GET', body: undefined }
      }
      continue
    }
    return resposta as unknown as Response
  }
  throw new EnderecoNaoPermitido('redirecionamentos demais')
}
