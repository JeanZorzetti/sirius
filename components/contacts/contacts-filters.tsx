'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Filter, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import type { EnrichedContact } from './contacts-data-table-client'

export const CONTACT_STATUSES = [
  { value: 'active',      label: 'Ativo' },
  { value: 'prospect',    label: 'Em prospecção' },
  { value: 'inactive',    label: 'Inativo' },
  { value: 'researching', label: 'Em pesquisa' },
  { value: 'trash',       label: 'Lixo' },
] as const

export type ContactStatus = typeof CONTACT_STATUSES[number]['value']

export const DEFAULT_SEGMENTS = [
  // Agronegócio
  'Cooperativa Agrícola',
  'Distribuidor de Insumos e Defensivos',
  'Fazenda / Produtor Rural',
  'Irrigação e Equipamentos Agrícolas',
  'Pecuária e Frigoríficos',
  // Agências e Marketing
  'Agência de Performance (Tráfego Pago / SEO)',
  'Agência de Branding e Design',
  'Assessoria de Imprensa e PR',
  'Produtora de Conteúdo e Vídeo',
  'Influencer Marketing',
  // Alimentação e Bebidas
  'Atacadista / Distribuidor Alimentar',
  'Bar e Restaurante',
  'Confeitaria / Doceria / Padaria',
  'Franquia de Alimentação',
  'Indústria de Alimentos e Bebidas',
  'Laticínios e Frigoríficos',
  // Construção e Engenharia
  'Construtora / Incorporadora',
  'Engenharia Elétrica e Automação',
  'Fornecedor de Materiais de Construção',
  'Instalações Hidráulicas e Elétricas',
  'Projetos Arquitetônicos',
  // e-Commerce e Varejo
  'e-Commerce / Loja Virtual',
  'Loja de Artigos Esportivos',
  'Loja de Moda e Vestuário',
  'Loja de Móveis e Decoração',
  'Loja de Produtos Naturais e Orgânicos',
  'Marketplace / Plataforma de Vendas',
  'Pet Shop e Produtos Animais',
  'Supermercado / Minimercado',
  // Educação
  'Colégio / Escola Particular',
  'Cursos Livres e Treinamentos',
  'EdTech / Plataforma EAD',
  'Escola de Idiomas',
  'Faculdade / IES',
  'Franquia Educacional',
  // Energia e Sustentabilidade
  'Distribuidora de Energia Elétrica',
  'Reciclagem e Gestão de Resíduos',
  'Solar Fotovoltaica / Integradora',
  // Eventos
  'Buffet e Cerimonial',
  'DJ / Entretenimento',
  'Espaço de Eventos',
  'Produtora de Eventos Corporativos',
  // Financeiro e Seguros
  'Assessoria de Investimentos / Corretora',
  'Correspondente Bancário / Fintech',
  'Corretora de Seguros',
  'Factoring / Antecipação de Recebíveis',
  'Planejamento Financeiro Pessoal',
  // Hardware, Indústria e Manufatura
  'Distribuidora de Eletrônicos',
  'Indústria Geral / Manufatura',
  'Metalúrgica e Siderurgia',
  'Mineração',
  'Química e Petroquímica',
  // Imobiliário
  'Administradora de Condomínios',
  'Construtora Residencial',
  'Corretor Autônomo',
  'Imobiliária',
  'Loteadora / Incorporadora',
  // Jurídico
  'Advocacia Empresarial',
  'Advocacia Trabalhista',
  'Cartório',
  'Contabilidade e Assessoria Fiscal',
  'Despachante e Regularização',
  // Logística e Transporte
  'Delivery / Last-Mile',
  'Operador Logístico / Fulfillment',
  'Transportadora / Frete',
  'Transitário / Importação e Exportação',
  // Mídia e Comunicação
  'Emissora de Rádio / TV',
  'Jornal / Portal de Notícias',
  'Out-of-Home (OOH) / Mídia Exterior',
  'Streaming e Podcasting',
  // ONGs e Setor Público
  'Associação Comercial / Sindicato',
  'Fundação / Instituto',
  'Governo Municipal / Estadual / Federal',
  'ONG / Entidade Sem Fins Lucrativos',
  // RH, Coaching e Consultoria
  'BPO e Terceirização',
  'Consultoria de Gestão e Estratégia',
  'Consultoria de RH e Recrutamento',
  'Coaching Executivo e Life Coaching',
  'Treinamento Corporativo',
  // Saúde
  'Clínica de Estética e Beleza',
  'Clínica Médica / Policlínica',
  'Clínica Odontológica',
  'Clínica Veterinária',
  'Farmácia / Drogaria',
  'Fitness / Academia / Crossfit',
  'Home Care e Cuidador',
  'Hospital / UPA',
  'Laboratório de Análises',
  'Plano de Saúde / Operadora',
  'Psicologia e Saúde Mental',
  'Salão de Beleza / Barbearia',
  // Software e Tecnologia
  'Agência de Desenvolvimento',
  'Consultoria em TI / Infraestrutura',
  'Integrações e APIs (iPaaS)',
  'SaaS B2B',
  'SaaS B2C / App Mobile',
  'Segurança da Informação',
  // Telecomunicações e Internet
  'ISP / Provedor de Internet',
  'Operadora de Telefonia',
  'Revenda de Telecom',
  // Turismo e Lazer
  'Agência de Turismo / Operadora',
  'Hotel / Pousada / Hostel',
  'Parque e Atração Turística',
  'Transporte Turístico (Van / Transfer)',
  // Serviços ao Consumidor
  'Assistência Técnica (Eletrônicos)',
  'Dedetização / Controle de Pragas',
  'Lavanderia / Tinturaria',
  'Limpeza e Conservação',
  'Manutenção Predial',
  'Oficina Mecânica / Auto Center',
  'Serviços Domésticos (Reforma, Pintura)',
]

export type ContactFilters = {
  assignees: string[]
  cities: string[]
  states: string[]
  statuses: string[]
  segments: string[]
}

export const EMPTY_FILTERS: ContactFilters = {
  assignees: [],
  cities: [],
  states: [],
  statuses: [],
  segments: [],
}

const NO_ASSIGNEE = '__none__'

interface ContactsFiltersProps {
  data: EnrichedContact[]
  value: ContactFilters
  onChange: (next: ContactFilters) => void
}

export function ContactsFilters({ data, value, onChange }: ContactsFiltersProps) {
  const { assigneeOptions, cityOptions, stateOptions } = useMemo(() => {
    const assigneeSet = new Set<string>()
    const citySet = new Set<string>()
    const stateSet = new Set<string>()
    let hasUnassigned = false

    for (const c of data) {
      if (c.assigneeName) assigneeSet.add(c.assigneeName)
      else hasUnassigned = true
      if (c.city?.trim()) citySet.add(c.city.trim())
      if (c.state?.trim()) stateSet.add(c.state.trim().toUpperCase())
    }

    const assignees = Array.from(assigneeSet).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    return {
      assigneeOptions: hasUnassigned ? [NO_ASSIGNEE, ...assignees] : assignees,
      cityOptions: Array.from(citySet).sort((a, b) => a.localeCompare(b, 'pt-BR')),
      stateOptions: Array.from(stateSet).sort(),
    }
  }, [data])

  const statusOptions = CONTACT_STATUSES.map(s => s.value)

  const totalActive =
    value.assignees.length +
    value.cities.length +
    value.states.length +
    value.statuses.length +
    value.segments.length

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterPopover
        label="Responsável"
        options={assigneeOptions}
        selected={value.assignees}
        onSelectedChange={(next) => onChange({ ...value, assignees: next })}
        renderOption={(opt) => (opt === NO_ASSIGNEE ? 'Sem responsável' : opt)}
      />
      <FilterPopover
        label="Cidade"
        options={cityOptions}
        selected={value.cities}
        onSelectedChange={(next) => onChange({ ...value, cities: next })}
      />
      <FilterPopover
        label="Estado"
        options={stateOptions}
        selected={value.states}
        onSelectedChange={(next) => onChange({ ...value, states: next })}
      />
      <FilterPopover
        label="Status"
        options={statusOptions}
        selected={value.statuses}
        onSelectedChange={(next) => onChange({ ...value, statuses: next })}
        renderOption={(opt) => CONTACT_STATUSES.find(s => s.value === opt)?.label ?? opt}
      />
      <SegmentFilterPopover
        selected={value.segments}
        onSelectedChange={(next) => onChange({ ...value, segments: next })}
      />
      {totalActive > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(EMPTY_FILTERS)}
          className="h-9 gap-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          <X className="h-3.5 w-3.5" />
          Limpar ({totalActive})
        </Button>
      )}
    </div>
  )
}

function SegmentFilterPopover({
  selected,
  onSelectedChange,
}: {
  selected: string[]
  onSelectedChange: (next: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [addValue, setAddValue] = useState('')
  const [extraSegments, setExtraSegments] = useState<string[]>([])
  const addInputRef = useRef<HTMLInputElement>(null)

  const allSegments = useMemo(
    () => [...DEFAULT_SEGMENTS, ...extraSegments],
    [extraSegments]
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return allSegments
    const q = search.toLowerCase()
    return allSegments.filter((s) => s.toLowerCase().includes(q))
  }, [allSegments, search])

  const isActive = selected.length > 0

  function toggle(opt: string) {
    if (selected.includes(opt)) {
      onSelectedChange(selected.filter((s) => s !== opt))
    } else {
      onSelectedChange([...selected, opt])
    }
  }

  function handleAdd() {
    const trimmed = addValue.trim()
    if (!trimmed) return
    const normalized = trimmed.toLowerCase()
    const exists = allSegments.find((s) => s.toLowerCase() === normalized)
    if (exists) {
      toast.info(`"${exists}" já existe na lista.`)
      setAddValue('')
      return
    }
    setExtraSegments((prev) => [...prev, trimmed])
    setAddValue('')
    toast.success(`Categoria "${trimmed}" adicionada.`)
  }

  function handleDeleteCustom(e: React.MouseEvent, opt: string) {
    e.stopPropagation()
    setExtraSegments((prev) => prev.filter((s) => s !== opt))
    onSelectedChange(selected.filter((s) => s !== opt))
    toast.success(`Categoria "${opt}" removida.`)
  }

  function handleAddKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  // Reset search when popover closes
  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 gap-2 border-dashed',
            isActive && 'border-solid border-indigo-500/40 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400'
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Segmento
          {isActive && (
            <span className="ml-1 rounded-full bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              {selected.length}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        {/* Search + Add row */}
        <div className="flex items-center gap-1.5 border-b border-border/60 p-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar segmento..."
            className="h-8 flex-1 text-sm"
            autoFocus
          />
          <div className="flex items-center gap-1">
            <Input
              ref={addInputRef}
              value={addValue}
              onChange={(e) => setAddValue(e.target.value)}
              onKeyDown={handleAddKeyDown}
              placeholder="Nova categoria"
              className="h-8 w-32 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAdd}
              className="h-8 w-8 shrink-0 p-0"
              title="Adicionar categoria"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Options list */}
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Nenhum resultado.
            </div>
          ) : (
            filtered.map((opt) => {
              const checked = selected.includes(opt)
              const isCustom = extraSegments.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left transition-colors',
                    'hover:bg-zinc-100 dark:hover:bg-zinc-800',
                    checked && 'bg-indigo-50/60 dark:bg-indigo-500/5'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                      checked
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-zinc-300 dark:border-zinc-600'
                    )}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </div>
                  <span className="truncate flex-1">{opt}</span>
                  {isCustom && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCustom(e, opt)}
                      className="shrink-0 rounded p-0.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-colors"
                      title="Remover categoria"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </button>
              )
            })
          )}
        </div>

        {selected.length > 0 && (
          <div className="border-t border-border/60 p-1">
            <button
              type="button"
              onClick={() => onSelectedChange([])}
              className="w-full rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Limpar seleção
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function FilterPopover({
  label,
  options,
  selected,
  onSelectedChange,
  renderOption,
}: {
  label: string
  options: string[]
  selected: string[]
  onSelectedChange: (next: string[]) => void
  renderOption?: (opt: string) => string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return options
    const q = search.toLowerCase()
    return options.filter((o) => {
      const l = (renderOption?.(o) ?? o).toLowerCase()
      return l.includes(q)
    })
  }, [options, search, renderOption])

  const isActive = selected.length > 0

  function toggle(opt: string) {
    if (selected.includes(opt)) {
      onSelectedChange(selected.filter((s) => s !== opt))
    } else {
      onSelectedChange([...selected, opt])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 gap-2 border-dashed',
            isActive && 'border-solid border-indigo-500/40 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400'
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          {label}
          {isActive && (
            <span className="ml-1 rounded-full bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              {selected.length}
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="border-b border-border/60 p-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Buscar ${label.toLowerCase()}...`}
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Nenhum resultado.
            </div>
          ) : (
            filtered.map((opt) => {
              const checked = selected.includes(opt)
              const display = renderOption?.(opt) ?? opt
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left transition-colors',
                    'hover:bg-zinc-100 dark:hover:bg-zinc-800',
                    checked && 'bg-indigo-50/60 dark:bg-indigo-500/5'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                      checked
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-zinc-300 dark:border-zinc-600'
                    )}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </div>
                  <span className={cn('truncate flex-1', opt === NO_ASSIGNEE && 'italic text-muted-foreground')}>
                    {display}
                  </span>
                </button>
              )
            })
          )}
        </div>
        {selected.length > 0 && (
          <div className="border-t border-border/60 p-1">
            <button
              type="button"
              onClick={() => onSelectedChange([])}
              className="w-full rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Limpar seleção
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function applyContactFilters(
  data: EnrichedContact[],
  filters: ContactFilters
): EnrichedContact[] {
  const { assignees, cities, states, statuses, segments } = filters

  if (
    assignees.length === 0 &&
    cities.length === 0 &&
    states.length === 0 &&
    statuses.length === 0 &&
    segments.length === 0
  ) {
    return data
  }

  const wantsUnassigned = assignees.includes(NO_ASSIGNEE)
  const wantedAssignees = new Set(assignees.filter((a) => a !== NO_ASSIGNEE))
  const wantedCities = new Set(cities)
  const wantedStates = new Set(states.map((s) => s.toUpperCase()))
  const wantedStatuses = new Set(statuses)
  const wantedSegments = new Set(segments)

  return data.filter((c) => {
    if (assignees.length > 0) {
      if (c.assigneeName) {
        if (!wantedAssignees.has(c.assigneeName)) return false
      } else {
        if (!wantsUnassigned) return false
      }
    }
    if (cities.length > 0) {
      if (!c.city || !wantedCities.has(c.city.trim())) return false
    }
    if (states.length > 0) {
      if (!c.state || !wantedStates.has(c.state.trim().toUpperCase())) return false
    }
    if (statuses.length > 0) {
      if (!c.status || !wantedStatuses.has(c.status)) return false
    }
    if (segments.length > 0) {
      if (!c.segment || !wantedSegments.has(c.segment)) return false
    }
    return true
  })
}
