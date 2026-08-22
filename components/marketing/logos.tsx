export function Logos() {
    const stats = [
        { value: '100+', label: 'Empresas ativas' },
        { value: '950+', label: 'Negócios gerenciados' },
        { value: '3h/sem', label: 'Economizadas por vendedor' },
        { value: '5 min', label: 'Para configurar' },
    ]

    return (
        <section className="py-12 border-y border-white/5 bg-black/20 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                            <div className="text-sm text-zinc-500 mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
