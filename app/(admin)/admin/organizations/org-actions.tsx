'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { 
    MoreHorizontal, 
    Trash2, 
    Crown,
    Copy,
    Check,
    AlertTriangle
} from "lucide-react"
import { updateOrganizationPlan, deleteOrganization } from "../actions"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { SubscriptionTier } from "@prisma/client"

interface OrgActionsProps {
    orgId: string
    currentTier: SubscriptionTier
    orgName: string
}

const PLAN_LABELS: Record<SubscriptionTier, string> = {
    FREE: "Grátis",
    STARTER: "Starter",
    PRO: "Pro",
    BUSINESS: "Business",
}

const PLAN_STYLES: Record<SubscriptionTier, string> = {
    FREE: "bg-slate-600 text-white",
    STARTER: "bg-blue-500 text-white",
    PRO: "bg-purple-500 text-white",
    BUSINESS: "bg-amber-500 text-white",
}

const PLAN_DESCRIPTIONS: Record<SubscriptionTier, string[]> = {
    FREE: ["Até 3 deals", "1 usuário", "CRM básico"],
    STARTER: ["Deals ilimitados", "Até 3 usuários", "1 WhatsApp", "100 leads/mês"],
    PRO: ["Deals ilimitados", "Até 10 usuários", "1 WhatsApp", "500 leads/mês", "Relatórios avançados"],
    BUSINESS: ["Tudo do Pro", "Usuários ilimitados", "Multi-WhatsApp", "2000 leads/mês", "Round-robin"],
}

export function OrgActions({ orgId, currentTier, orgName }: OrgActionsProps) {
    const [isPending, startTransition] = useTransition()
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showTierDialog, setShowTierDialog] = useState(false)
    const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(currentTier)
    const [copied, setCopied] = useState(false)
    const router = useRouter()

    const handlePlanChange = (tier: SubscriptionTier) => {
        setSelectedTier(tier)
        setShowTierDialog(true)
    }

    const confirmPlanChange = () => {
        startTransition(async () => {
            await updateOrganizationPlan(orgId, selectedTier)
            setShowTierDialog(false)
            router.refresh()
        })
    }

    const handleDelete = () => {
        startTransition(async () => {
            await deleteOrganization(orgId)
            setShowDeleteDialog(false)
            router.refresh()
        })
    }

    const handleCopyId = () => {
        navigator.clipboard.writeText(orgId)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-white">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200 w-56">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    
                    <DropdownMenuItem 
                        onClick={handleCopyId}
                        className="cursor-pointer"
                    >
                        {copied ? (
                            <Check className="mr-2 h-4 w-4 text-green-500" />
                        ) : (
                            <Copy className="mr-2 h-4 w-4" />
                        )}
                        {copied ? "Copiado!" : "Copiar ID"}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-zinc-800" />
                    
                    <DropdownMenuLabel className="text-xs text-zinc-500">
                        Alterar Plano (atual: {PLAN_LABELS[currentTier]})
                    </DropdownMenuLabel>

                    {(Object.keys(PLAN_LABELS) as SubscriptionTier[])
                        .filter(tier => tier !== currentTier)
                        .map(tier => (
                            <DropdownMenuItem
                                key={tier}
                                onClick={() => handlePlanChange(tier)}
                                className={`cursor-pointer ${
                                    tier === 'FREE' ? 'text-slate-400' :
                                    tier === 'STARTER' ? 'text-blue-400' :
                                    tier === 'PRO' ? 'text-purple-400' :
                                    'text-amber-400'
                                }`}
                                disabled={isPending}
                            >
                                <Crown className="mr-2 h-4 w-4" />
                                Mudar para {PLAN_LABELS[tier]}
                            </DropdownMenuItem>
                        ))
                    }

                    <DropdownMenuSeparator className="bg-zinc-800" />
                    
                    <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-red-500 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                        disabled={isPending}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir Organização
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Tier Change Confirmation Dialog */}
            <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-primary" />
                            Confirmar Alteração de Plano
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Você está alterando o plano da organização <strong>{orgName}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg">
                            <span className="text-zinc-500">Plano atual:</span>
                            <Badge className={PLAN_STYLES[currentTier]}>
                                {PLAN_LABELS[currentTier]}
                            </Badge>
                        </div>
                        
                        <div className="flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                                <span className="text-zinc-500">→</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg">
                            <span className="text-zinc-500">Novo plano:</span>
                            <Badge className={PLAN_STYLES[selectedTier]}>
                                {PLAN_LABELS[selectedTier]}
                            </Badge>
                        </div>

                        <div className="bg-zinc-950 p-3 rounded-lg space-y-2">
                            <span className="text-sm text-zinc-500">Recursos incluídos:</span>
                            <ul className="text-sm text-zinc-400 space-y-1">
                                {PLAN_DESCRIPTIONS[selectedTier].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <Check className="w-3 h-3 text-green-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setShowTierDialog(false)}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={confirmPlanChange}
                            disabled={isPending}
                            className={selectedTier === 'FREE' ? 'bg-slate-600 hover:bg-slate-700' :
                                       selectedTier === 'STARTER' ? 'bg-blue-600 hover:bg-blue-700' :
                                       selectedTier === 'PRO' ? 'bg-purple-600 hover:bg-purple-700' :
                                       'bg-amber-600 hover:bg-amber-700'}
                        >
                            {isPending ? "Atualizando..." : "Confirmar Alteração"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-500">
                            <AlertTriangle className="w-5 h-5" />
                            Excluir Organização
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Tem certeza que deseja excluir <strong>{orgName}</strong>? 
                            Esta ação não pode ser desfeita e todos os dados serão perdidos:
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 space-y-2">
                        <p className="text-sm text-red-400">Esta ação irá excluir:</p>
                        <ul className="text-sm text-red-300/80 space-y-1">
                            <li>• Todos os usuários da organização</li>
                            <li>• Todos os deals e contatos</li>
                            <li>• Todo histórico de atividades</li>
                            <li>• Configurações e pipelines</li>
                        </ul>
                    </div>

                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setShowDeleteDialog(false)}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleDelete}
                            disabled={isPending}
                            variant="destructive"
                        >
                            {isPending ? "Excluindo..." : "Sim, Excluir Tudo"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
