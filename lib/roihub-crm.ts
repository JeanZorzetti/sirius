import { after } from 'next/server'
import { createHash } from 'node:crypto'

// O CRM de vendas do Sirius CRM e o do roihub (hub.roilabs.com.br) — nao este produto, que e
// o CRM DO CLIENTE. Ate 01/09/2026 os formularios do site so disparavam e-mail (contato) e
// criavam contato no Resend (calculadora): lead que so existe em caixa de entrada nao tem
// denominador, e o `CR(clique->lead)` do projeto ficava `nao apurado` no funil do hub, com
// 56 cliques/28d no Search Console e nenhum numerador.
// Contexto: roihub/handoff/funil-seo/00-LEIA-PRIMEIRO.md

/**
 * `<slug>:<superficie>` — e a `origem` que separa canal no CRM. Uniao fechada de proposito:
 * origem digitada a mao nasce divergente e a leitura por canal fica impossivel depois.
 */
export type RoihubOrigem = 'sirius:contato' | 'sirius:calculadora-roi'

type RoihubLeadInput = {
  nome: string
  email: string
  telefone?: string | null
  origem: RoihubOrigem
  metadata?: Record<string, unknown>
}

// Bucket de 2min agrupa reenvio tecnico (retry) no mesmo external_id, deduplicado pelo
// UNIQUE(external_id) do roihub. Reenvio intencional depois de 2min vira card novo — aceitavel
// no volume de lead de marketing. Mesmo esquema do sofia-next (src/lib/roihub-crm.ts).
function externalId(email: string, origem: string): string {
  const bucket = Math.floor(Date.now() / 120_000)
  return createHash('sha256').update(`${email}|${origem}|${bucket}`).digest('hex')
}

/**
 * Envia o lead ao CRM do roihub (POST /api/crm/leads), best-effort.
 *
 * Roda em `after()`, depois da resposta ja enviada ao visitante, e NUNCA lanca: o formulario
 * do site nao pode quebrar porque o hub esta fora.
 *
 * ⚠️ O preco disso: sem ROIHUB_CRM_URL/ROIHUB_CRM_SECRET no ambiente o visitante recebe 200
 * igual e o lead simplesmente nao chega. A unica prova de lead salvo e a linha em `crm_leads`
 * — `node --env-file=.env scripts/funil.mjs --ver` no roihub lista os leads nome a nome.
 */
export function sendLeadToRoihub(input: RoihubLeadInput): void {
  after(async () => {
    try {
      const baseUrl = process.env.ROIHUB_CRM_URL
      const secret = process.env.ROIHUB_CRM_SECRET
      if (!baseUrl || !secret) {
        console.error('[roihub-crm] ROIHUB_CRM_URL/ROIHUB_CRM_SECRET ausente')
        return
      }

      const email = input.email.trim().toLowerCase()
      const res = await fetch(`${baseUrl}/api/crm/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
        body: JSON.stringify({
          external_id: externalId(email, input.origem),
          pipeline: 'sirius',
          nome: input.nome,
          email,
          telefone: input.telefone || undefined,
          origem: input.origem,
          metadata: input.metadata ?? {},
        }),
      })

      if (!res.ok) console.error(`[roihub-crm] roihub retornou ${res.status}`)
    } catch (err) {
      console.error('[roihub-crm] falha ao enviar lead:', err)
    }
  })
}
