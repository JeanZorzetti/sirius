
export function Logos() {
    const logos = [
        { name: "Acme Corp" },
        { name: "Global Bank" },
        { name: "SaaS Inc" },
        { name: "TechStart" },
        { name: "FutureLabs" },
        { name: "MarketingPro" }
    ]

    return (
        <section className="py-12 border-y border-white/5 bg-black/20 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <p className="text-center text-sm font-medium text-zinc-500 mb-8 uppercase tracking-widest">
                    Confiado por empresas inovadoras
                </p>
                <div className="flex items-center justify-center gap-12 md:gap-20 flex-wrap opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                    {logos.map((logo, i) => (
                        <div key={i} className="text-xl font-bold text-zinc-300 flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-zinc-700/50" />
                            {logo.name}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
