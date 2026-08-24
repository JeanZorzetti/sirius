/**
 * Formatadores pt-BR compartilhados — substitui as implementações locais
 * espalhadas por components/ e lib/ (US7, spec 002-remove-dead-code).
 *
 * Cada função aqui reproduz o comportamento já visível nas telas que a
 * consolidação absorveu. Onde duas implementações divergiam de verdade
 * (não só de forma), a decisão está registrada no handoff da US7.
 */

export function formatCurrency(
  value: number | null | undefined,
  opts?: Intl.NumberFormatOptions
): string {
  const safeValue = value === null || value === undefined || Number.isNaN(value) ? 0 : value
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    ...opts,
  }).format(safeValue)
}

export type DateStyle = 'short' | 'long' | 'datetime' | 'datetime-short' | 'day-month'

export function formatDate(
  date: Date | string | null | undefined,
  style: DateStyle = 'short'
): string {
  if (!date) return ''
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''

  switch (style) {
    case 'long':
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    case 'datetime':
      return d.toLocaleString('pt-BR')
    case 'datetime-short':
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d)
    case 'day-month':
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    case 'short':
    default:
      return d.toLocaleDateString('pt-BR')
  }
}

/**
 * Formata telefone BR a partir de dígitos crus (com ou sem 55 na frente).
 * União das 3 implementações antigas: nenhuma perdia caso, a de
 * `conversation-item.tsx` só cobria 10 dígitos e omitia o "+55" nos
 * números com DDI — aqui os dois comportamentos coexistem.
 */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw || raw.includes('@')) return ''
  const d = raw.replace(/\D/g, '')
  if (d.startsWith('55') && d.length === 13) return `+55 (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`
  if (d.startsWith('55') && d.length === 12) return `+55 (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return raw
}

/**
 * Tempo relativo granular (agora/min/h/d), com fallback pra data completa
 * depois de 7 dias. Absorve `relativeTime` (task-activity-feed.tsx, já
 * granular) e `timeAgo` (ia-knowledge.tsx, só "hoje"/"ontem"/"Xd atrás") —
 * a versão granular venceu por ser estritamente mais informativa.
 */
export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return ''
  const target = new Date(date).getTime()
  if (Number.isNaN(target)) return ''
  const diff = Date.now() - target
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d atrás`
  return formatDate(date)
}
