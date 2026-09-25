'use client'

import Link from 'next/link'
import { useId } from 'react'
import { linhaDePulso } from '@/components/fluxo/geometria'
import { LIMIAR_PARADO_DIAS, dinheiro, dinheiroCompacto, montarFila, resumirEtapa, temValor } from '@/lib/pipeline/hoje'
import type { PipelineDeal } from '@/lib/types/pipeline'

// The home's closing pulse, reused as the queue's underline (spec 009)
const PULSO = linhaDePulso(600, 24, 6)

/**
 * "Today" (spec 009): the open deals of the selected pipeline that ask for action — overdue follow-up first, then the
 * longest stalled — above the board. Three large on desktop plus a count of the rest; a sideways rail on the phone.
 */
export function FilaDeHoje({ deals, onAbrir }: { deals: PipelineDeal[]; onAbrir: (deal: PipelineDeal) => void }) {
  // rendered twice (desktop and phone, one hidden): the heading id must be unique per instance
  const idTitulo = useId()
  const agora = new Date()
  const fila = montarFila(deals, agora)
  const resumo = resumirEtapa(deals, agora)
  const grandes = fila.slice(0, 3)
  const resto = fila.slice(3)
  const diasResto = resto.map((f) => f.fato.dias ?? 0)
  const hora = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(agora)
  const titulo =
    fila.length === 0
      ? 'Nenhum negócio pede ação hoje'
      : `${fila.length} ${fila.length === 1 ? 'negócio pede' : 'negócios pedem'} ação hoje`

  return (
    <section
      aria-labelledby={idTitulo}
      className="hoje-fila mb-4 rounded-[calc(var(--radius)*2)] border border-border px-4 pb-4 pt-3 lg:mb-5 lg:px-5"
    >
      <header className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <div>
          <h2 id={idTitulo} data-fila-titulo className="text-[17px] font-bold tracking-tight">
            {titulo}
          </h2>
          <svg className="hoje-pulso mt-1 block h-3 w-40" viewBox="0 0 600 24" preserveAspectRatio="none" aria-hidden="true">
            <path d={PULSO} pathLength={1} />
          </svg>
        </div>
        <p className="hoje-mono text-[11.5px] text-muted-foreground">
          {fila.length === 0
            ? `nenhum retorno vencido nem negócio parado há mais de ${LIMIAR_PARADO_DIAS} d neste funil`
            : 'retorno vencido primeiro, depois quem está parado há mais tempo'}
          {' · '}
          {resumo.n} {resumo.n === 1 ? 'negócio' : 'negócios'}
          {resumo.comValor > 0 ? ` · ${dinheiroCompacto(resumo.soma)} em ${resumo.comValor} com valor` : ' · sem valor'}
          {' · '}
          {/* server and browser render a minute apart at worst */}
          <span suppressHydrationWarning>atualizado às {hora}</span>
        </p>
      </header>

      {fila.length === 0 && (
        <p className="flex min-h-[96px] items-center text-sm text-muted-foreground">
          Um negócio aparece aqui quando o prazo de retorno vence ou quando passa {LIMIAR_PARADO_DIAS} dias na mesma etapa.
        </p>
      )}

      {fila.length > 0 && (
        <ol className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:grid lg:snap-none lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(140px,170px)] lg:overflow-visible lg:px-0">
          {grandes.map(({ negocio, fato }, i) => {
            const contato = negocio.contact
            const fone = contato?.phone?.replace(/\D/g, '')
            return (
              <li
                key={negocio.id}
                className="hoje-fila-item w-[82%] shrink-0 snap-start rounded-[var(--radius)] border border-border bg-[var(--hoje-fila-item)] p-3.5 lg:w-auto"
              >
                <p className="hoje-mono flex items-center gap-2 text-[11px] font-medium uppercase tracking-[.06em] text-[var(--hoje-acento-texto)]">
                  {fato.tipo === 'retorno' ? 'retorno venceu' : 'parado na etapa'}
                  {negocio.exemplo && (
                    <span className="rounded-sm border border-border px-1 normal-case tracking-normal text-muted-foreground">exemplo</span>
                  )}
                </p>
                {/* the queue is ranked: the first one is the screen's answer, so it gets the big number */}
                <p className={`mb-2 mt-1 font-extrabold leading-none tracking-tight tabular-nums ${i === 0 ? 'text-[56px]' : 'text-[34px]'}`}>
                  {fato.dias}
                  <span className="ml-1 text-sm font-semibold tracking-normal text-muted-foreground">
                    {fato.tipo === 'retorno' ? (fato.dias === 1 ? 'dia de atraso' : 'dias de atraso') : fato.dias === 1 ? 'dia' : 'dias'}
                  </span>
                </p>
                <h3 className="truncate text-sm font-semibold" title={negocio.title}>
                  {negocio.title}
                </h3>
                <p className="mt-0.5 flex justify-between gap-2 text-[12.5px] text-muted-foreground">
                  <span className="truncate">{contato?.name ?? 'sem contato'}</span>
                  <span className={`hoje-mono shrink-0 tabular-nums ${temValor(negocio) ? 'font-medium text-foreground' : ''}`}>
                    {temValor(negocio) ? dinheiro(negocio.value as number) : 'sem valor'}
                  </span>
                </p>
                <div className="mt-3 flex gap-2">
                  {fone ? (
                    <Link
                      href={`/dashboard/chat?phone=${fone}`}
                      className="flex h-9 flex-1 items-center justify-center rounded-[var(--radius)] bg-primary text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      Conversar<span className="sr-only"> com {contato?.name}</span>
                    </Link>
                  ) : (
                    <span className="flex h-9 flex-1 items-center justify-center rounded-[var(--radius)] border border-dashed border-border px-2 text-center text-[12px] text-muted-foreground">
                      Contato sem telefone
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onAbrir(negocio)}
                    className="h-9 flex-1 rounded-[var(--radius)] border border-input text-[13px] font-semibold transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    Abrir negócio<span className="sr-only">: {negocio.title}</span>
                  </button>
                </div>
              </li>
            )
          })}
          {resto.length > 0 && (
            <li className="hoje-fila-item flex w-[40%] shrink-0 snap-start flex-col justify-center gap-1 rounded-[var(--radius)] border border-dashed border-input p-3.5 lg:w-auto">
              <span className="text-[28px] font-extrabold leading-none tabular-nums">+{resto.length}</span>
              <span className="hoje-mono text-[12px] leading-snug text-muted-foreground">
                na fila
                <br />
                de {Math.min(...diasResto)} a {Math.max(...diasResto)} dias
              </span>
            </li>
          )}
        </ol>
      )}
    </section>
  )
}
