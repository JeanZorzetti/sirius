'use client'

import { Rocket, CheckCircle2, Sparkles, Zap, TrendingUp, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import Link from 'next/link'

interface FeatureGateModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
}

export function FeatureGateModal({
    isOpen,
    onClose,
    title = "Desbloqueie o Poder Máximo ⚡",
    description = "Você atingiu o limite do plano gratuito. Evolua para o Pro e escale suas vendas sem barreiras."
}: FeatureGateModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[440px] p-0 max-h-[90vh] flex flex-col border-0 shadow-2xl bg-zinc-950 text-white ring-1 ring-white/10 gap-0">

                {/* Header Section - FIXED (shrink-0) */}
                <div className="relative pt-6 pb-5 px-5 bg-gradient-to-br from-indigo-950 via-zinc-900 to-zinc-950 overflow-hidden text-center shrink-0">
                    {/* Background Effects */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-purple-500/20 blur-[60px] rounded-full pointing-events-none" />
                    <div className="absolute bottom-[-30px] left-[-30px] w-40 h-40 bg-indigo-500/10 blur-[50px] rounded-full pointing-events-none" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-3 ring-1 ring-white/10 shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)] backdrop-blur-sm animate-pulse">
                            <Crown className="w-6 h-6 text-indigo-400" />
                        </div>
                        <DialogHeader className="space-y-1">
                            <DialogTitle className="text-lg font-bold text-center bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                                {title}
                            </DialogTitle>
                            <DialogDescription className="text-center text-zinc-400 text-xs max-w-[280px] mx-auto leading-relaxed">
                                {description}
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                </div>

                {/* Features List - SCROLLABLE (flex-1 overflow-y-auto) */}
                <div className="px-5 py-4 bg-zinc-950 flex-1 overflow-y-auto min-h-0">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                            <div className="p-1.5 rounded-lg bg-green-500/10 text-green-400 group-hover:scale-110 transition-transform shrink-0">
                                <Zap className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-zinc-200">Negócios Ilimitados</span>
                                <span className="text-[10px] text-zinc-500">Crie quantos deals sua empresa precisar</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform shrink-0">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-zinc-200">Contatos Ilimitados</span>
                                <span className="text-[10px] text-zinc-500">Gerencie sua base sem restrições</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform shrink-0">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-zinc-200">Analytics Avançado</span>
                                <span className="text-[10px] text-zinc-500">Insights inteligentes para vender mais</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - FIXED (shrink-0) */}
                <div className="p-5 pt-2 bg-zinc-950 shrink-0">
                    <DialogFooter className="flex-col gap-2 sm:gap-0">
                        <Button asChild size="lg" className="w-full h-10 relative overflow-hidden group bg-white text-zinc-950 hover:bg-zinc-200 hover:text-zinc-950 border-0 shadow-lg shadow-indigo-500/10">
                            <Link href="/dashboard/billing" className="flex items-center justify-center gap-2">
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                <Rocket className="w-4 h-4 relative z-10" />
                                <span className="font-bold text-sm relative z-10">Fazer Upgrade (R$ 49/mês)</span>
                            </Link>
                        </Button>
                        <Button variant="ghost" className="w-full h-8 text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-transparent uppercase tracking-wider font-medium" onClick={onClose}>
                            Continuar no plano Gratuito
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
