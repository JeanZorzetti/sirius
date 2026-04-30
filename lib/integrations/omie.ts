/**
 * Omie ERP API client
 * All calls use POST to https://app.omie.com.br/api/v1/{service}/
 * with app_key + app_secret + call + param[] in the body.
 */

const OMIE_BASE = 'https://app.omie.com.br/api/v1'

interface OmieCredentials {
  appKey: string
  appSecret: string
}

async function omieCall<T>(
  credentials: OmieCredentials,
  service: string,
  call: string,
  param: Record<string, unknown>[]
): Promise<T> {
  const res = await fetch(`${OMIE_BASE}/${service}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_key:    credentials.appKey,
      app_secret: credentials.appSecret,
      call,
      param,
    }),
  })
  const data = await res.json()
  if (data.faultstring) throw new Error(`Omie API error: ${data.faultstring}`)
  return data as T
}

// ─── Clientes ────────────────────────────────────────────────────────────────

export interface OmieCliente {
  codigo_cliente_omie:       number
  codigo_cliente_integracao: string
  razao_social:              string
  nome_fantasia:             string
  cnpj_cpf:                  string
  email:                     string
  telefone1_ddd:             string
  telefone1_numero:          string
  cidade:                    string
  estado:                    string
}

export async function listarClientes(
  credentials: OmieCredentials,
  pagina = 1,
  registrosPorPagina = 50
): Promise<{ clientes_cadastro: OmieCliente[]; total_de_registros: number; total_de_paginas: number }> {
  return omieCall(credentials, 'geral/clientes', 'ListarClientes', [
    { pagina, registros_por_pagina: registrosPorPagina, apenas_importado_api: 'N' },
  ])
}

export async function incluirCliente(
  credentials: OmieCredentials,
  cliente: Partial<OmieCliente>
): Promise<{ codigo_cliente_omie: number; codigo_cliente_integracao: string }> {
  return omieCall(credentials, 'geral/clientes', 'IncluirCliente', [cliente])
}

export async function upsertCliente(
  credentials: OmieCredentials,
  cliente: Partial<OmieCliente>
): Promise<{ codigo_cliente_omie: number; codigo_cliente_integracao: string }> {
  return omieCall(credentials, 'geral/clientes', 'UpsertCliente', [cliente])
}

// ─── Pedidos ─────────────────────────────────────────────────────────────────

export interface OmiePedido {
  codigo_pedido?:             number
  codigo_pedido_integracao?:  string
  codigo_cliente:             number
  etapa:                      string // "10" = pedido, "00" = orçamento
  produtos:                   OmieProdutoPedido[]
}

export interface OmieProdutoPedido {
  codigo_produto:  number
  quantidade:      number
  valor_unitario:  number
  descricao?:      string
}

export async function incluirPedido(
  credentials: OmieCredentials,
  pedido: OmiePedido
): Promise<{ numero_pedido: number; codigo_pedido: number }> {
  return omieCall(credentials, 'produtos/pedido', 'IncluirPedido', [{ cabecalho: pedido, det: pedido.produtos.map(p => ({ produto: p })) }])
}

// ─── Contas a Receber ─────────────────────────────────────────────────────────

export interface OmieTitulo {
  codigo_lancamento_omie:        number
  codigo_lancamento_integracao:  string
  codigo_cliente:                number
  valor_documento:               number
  data_vencimento:               string
  status_titulo:                 string // "RECEBIDO" | "VENCIDO" | "A_VENCER"
  data_previsao:                 string
}

export async function listarContasReceber(
  credentials: OmieCredentials,
  codigoCliente?: number,
  pagina = 1
): Promise<{ lancamentos: OmieTitulo[]; total_de_registros: number }> {
  const param: Record<string, unknown> = { pagina, registros_por_pagina: 50 }
  if (codigoCliente) param.codigo_cliente = codigoCliente
  return omieCall(credentials, 'financas/contareceber', 'ListarContasReceber', [param])
}
