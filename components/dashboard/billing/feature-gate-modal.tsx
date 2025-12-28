'use client'

import { Rocket, CheckCircle2, Lock } from 'lucide-react'
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
    title = "Desbloqueie todo o potencial",
    description = "Você atingiu o limite do plano gratuito."
}: FeatureGateModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-2 border-primary/20">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

                <div className="p-6 pt-8 text-center bg-muted/30">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary animate-pulse">
                        <Lock className="w-8 h-8" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center mb-2">
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-center text-base">
                            {description}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border shadow-sm">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                            <span className="text-sm font-medium">Negócios Ilimitados</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border shadow-sm">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                            <span className="text-sm font-medium">Contatos Ilimitados</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border shadow-sm">
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                            <span className="text-sm font-medium">Analytics Avançado</span>
                        </div>
                    </div>

                    <DialogFooter className="flex-col gap-2 sm:gap-0 mt-6">
                        <Button asChild size="lg" className="w-full gap-2 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20">
                            <Link href="/dashboard/billing">
                                <Rocket className="w-4 h-4" />
                                Fazer Upgrade Agora (R$ 49/mês)
                            </Link>
                        </Button>
                        <Button variant="ghost" className="w-full mt-2" onClick={onClose}>
                            Talvez depois
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}
