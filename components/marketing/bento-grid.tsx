import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, Zap, LayoutKanban, ArrowUpRight } from "lucide-react"

export function BentoGrid() {
    return (
        <section className="py-24 px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-16 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">Tudo o que você precisa</h2>
                    <p className="text-zinc-400 max-w-2xl mx-auto">Uma suite completa para acelerar seu processo comercial.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4 h-[800px] md:h-[600px]">

                    {/* Bento Item 1: Kanban (Large) */}
                    <div className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.04] transition-colors p-8 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit">
                                <LayoutKanban className="h-6 w-6" />
                            </div>
                            <Badge variant="outline" className="border-indigo-500/30 text-indigo-400">Core</Badge>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Kanban Drag & Drop</h3>
                        <p className="text-zinc-400 mb-8 max-w-md">Gerencie seu pipeline visualmente. Mova oportunidades entre etapas e nunca perca o timing de uma venda.</p>

                        {/* Visual Mockup */}
                        <div className="flex-1 w-full bg-zinc-900/50 rounded-xl border border-white/5 p-4 relative overflow-hidden group-hover:border-indigo-500/20 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent" />
                            <div className="flex gap-4 h-full">
                                {/* Column 1 */}
                                <div className="w-1/3 h-full flex flex-col gap-3">
                                    <div className="h-6 w-24 bg-zinc-800 rounded mb-2"></div>
                                    <div className="h-24 w-full bg-zinc-800/50 rounded-lg border border-white/5 p-3 hover:translate-y-[-2px] transition-transform duration-300 shadow-lg">
                                        <div className="h-2 w-16 bg-indigo-500/40 rounded mb-2"></div>
                                        <div className="h-3 w-3/4 bg-zinc-700 rounded"></div>
                                    </div>
                                    <div className="h-24 w-full bg-zinc-800/50 rounded-lg border border-white/5 p-3 hover:translate-y-[-2px] transition-transform duration-300 shadow-lg">
                                        <div className="h-2 w-16 bg-purple-500/40 rounded mb-2"></div>
                                        <div className="h-3 w-1/2 bg-zinc-700 rounded"></div>
                                    </div>
                                </div>
                                {/* Column 2 */}
                                <div className="w-1/3 h-full flex flex-col gap-3">
                                    <div className="h-6 w-20 bg-zinc-800 rounded mb-2"></div>
                                    <div className="h-24 w-full bg-zinc-800/50 rounded-lg border border-white/5 p-3 hover:translate-y-[-2px] transition-transform duration-500 shadow-lg mt-8">
                                        <div className="h-2 w-12 bg-green-500/40 rounded mb-2"></div>
                                        <div className="h-3 w-2/3 bg-zinc-700 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bento Item 2: Analytics */}
                    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.04] transition-colors p-6 flex flex-col justify-between">
                        <div>
                            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-4">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">Analytics em Tempo Real</h3>
                            <p className="text-sm text-zinc-400">Métricas que importam.</p>
                        </div>
                        <div className="mt-4 flex items-end gap-1 h-24 w-full opacity-60 group-hover:opacity-100 transition-opacity">
                            {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                                <div key={i} className="flex-1 bg-purple-500 rounded-t-sm" style={{ height: `${h}%`, opacity: 0.3 + (i * 0.1) }}></div>
                            ))}
                        </div>
                    </div>

                    {/* Bento Item 3: Speed */}
                    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl hover:bg-white/[0.04] transition-colors p-6">
                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight className="h-6 w-6 text-zinc-500" />
                        </div>
                        <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-400 w-fit mb-4">
                            <Zap className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Performance Extrema</h3>
                        <p className="text-sm text-zinc-400">Interface otimizada para velocidade. Atalhos de teclado, loading states instantâneos e cache inteligente.</p>
                    </div>

                </div>
            </div>
        </section>
    )
}
