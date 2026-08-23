const COLUMNS = [
    {
        name: 'Prospecção',
        total: 'R$ 12.400',
        accent: false,
        cards: [
            { company: 'Alfa Distribuidora', value: 'R$ 4.200', owner: 'AC' },
            { company: 'Beta Comércio', value: 'R$ 3.100', owner: 'RM' },
        ],
    },
    {
        name: 'Orçamento',
        total: 'R$ 28.900',
        accent: false,
        cards: [
            { company: 'Gama Serviços', value: 'R$ 9.800', owner: 'JS' },
            { company: 'Delta Materiais', value: 'R$ 6.500', owner: 'AC' },
        ],
    },
    {
        name: 'Fechamento',
        total: 'R$ 15.200',
        accent: false,
        cards: [
            { company: 'Épsilon Log', value: 'R$ 15.200', owner: 'RM' },
        ],
    },
    {
        name: 'Ganho',
        total: 'R$ 41.000',
        accent: true,
        cards: [
            { company: 'Zeta Indústria', value: 'R$ 22.000', owner: 'JS' },
            { company: 'Theta Corp', value: 'R$ 19.000', owner: 'AC' },
        ],
    },
] as const

export function KanbanPreview() {
    return (
        <div
            role="img"
            aria-label="Captura de tela do pipeline Kanban do Sirius CRM, mostrando negócios organizados por estágio de venda"
            className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden"
        >
            <div aria-hidden="true">
                {/* Fake top bar */}
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                    <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                    </div>
                    <span className="text-xs font-medium text-zinc-400">Pipeline · Vendas</span>
                    <span className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                        + Novo Deal
                    </span>
                </div>

                {/* Columns */}
                <div className="flex gap-4 overflow-x-auto px-5 py-5">
                    {COLUMNS.map((col) => (
                        <div key={col.name} className="w-56 shrink-0">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                    {col.name}
                                </span>
                                <span className="text-xs text-zinc-500">{col.total}</span>
                            </div>
                            <div className={`mb-3 h-1 rounded-full ${col.accent ? 'bg-green-500/70' : 'bg-indigo-500/50'}`} />
                            <div className="space-y-2">
                                {col.cards.map((card) => (
                                    <div
                                        key={card.company}
                                        className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                                    >
                                        <div className="text-xs font-semibold text-white">{card.company}</div>
                                        <div className="mt-1 flex items-center justify-between">
                                            <span className="text-xs text-zinc-400">{card.value}</span>
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-[10px] font-bold text-white">
                                                {card.owner}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
