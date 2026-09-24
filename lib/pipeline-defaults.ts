// Single source for the pipeline every new account starts with.
// Read by signup (app/auth/actions.ts) and the demo seed (lib/seed-demo-data.ts).

export const DEFAULT_STAGES = [
  { name: 'Lead', order: 0 },
  { name: 'Prospecção', order: 1 },
  { name: 'Qualificação', order: 2 },
  { name: 'Proposta', order: 3 },
  { name: 'Fechamento', order: 4 },
] as const

export type DemoDeal = {
  title: string
  value: number
  contactIndex: number
  stageIndex: number
  /** days from seeding; negative = already past */
  dueInDays: number
  won?: boolean
  notes: string[]
}

export const DEMO_DEALS: DemoDeal[] = [
  {
    title: 'Implementação CRM - Tech Solutions',
    value: 15000,
    contactIndex: 0,
    stageIndex: 0,
    dueInDays: 2,
    notes: [
      'Cliente veio por indicação do LinkedIn',
      'Empresa tem 25 funcionários e está crescendo rápido',
      'Budget aprovado para Q1 2026',
    ],
  },
  {
    title: 'Sistema de Gestão - Energia Solar',
    value: 8500,
    contactIndex: 1,
    stageIndex: 3,
    dueInDays: 5,
    notes: [
      'Já testaram 2 concorrentes mas não gostaram',
      'Prioridade: integração com sistema de estoque',
      'Decisor: Carlos (CEO) - super engajado',
    ],
  },
  {
    title: 'Automação de Marketing - Marketing Pro',
    value: 12000,
    contactIndex: 2,
    stageIndex: 2,
    dueInDays: 7,
    notes: [
      'Proposta enviada na segunda-feira',
      'Aguardando aprovação da diretoria',
      'Concorrente: RD Station (mas acham caro)',
    ],
  },
  {
    title: 'CRM para Construtora',
    value: 22000,
    contactIndex: 3,
    stageIndex: 1,
    dueInDays: 10,
    notes: [
      'Empresa tradicional, primeira vez usando CRM',
      'Precisam de muito treinamento',
      'Orçamento depende de financiamento aprovado',
    ],
  },
  {
    title: 'Consultoria + CRM',
    value: 5500,
    contactIndex: 4,
    stageIndex: 4,
    dueInDays: -2,
    won: true,
    notes: [
      'Deal fechado! 🎉',
      'Pagamento via boleto em 3x',
      'Onboarding agendado para próxima semana',
    ],
  },
  {
    title: 'Expansão - Tech Solutions (Upsell)',
    value: 8000,
    contactIndex: 0,
    stageIndex: 0,
    dueInDays: -1,
    notes: [
      '⚠️ Follow-up URGENTE - cliente pediu proposta há 3 dias',
      'Upsell do plano atual',
      'Precisa ligar HOJE!',
    ],
  },
]
