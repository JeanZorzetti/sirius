'use client'

import { useEffect, useState } from 'react'
import { ArrowLeftRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { moveDealToPipeline } from '@/app/[locale]/dashboard/actions'
import type { PipelineOption } from './types'

export function TransferPipelineDialog({
    open,
    onOpenChange,
    dealId,
    pipelines,
    onTransferred,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    dealId: string
    pipelines: PipelineOption[]
    onTransferred: () => void
}) {
    const [pipelineId, setPipelineId] = useState('')
    const [stageId, setStageId] = useState('')
    const [transferring, setTransferring] = useState(false)

    // Reset selection every time the dialog opens
    useEffect(() => {
        if (open) {
            setPipelineId('')
            setStageId('')
        }
    }, [open])

    const handleTransfer = async () => {
        if (!pipelineId || !stageId) return
        setTransferring(true)
        try {
            const result = await moveDealToPipeline(dealId, pipelineId, stageId)
            if (result.success) {
                toast.success('Negócio transferido com sucesso!')
                onOpenChange(false)
                onTransferred()
            } else {
                toast.error(result.error || 'Erro ao transferir negócio')
            }
        } catch {
            toast.error('Erro ao transferir negócio')
        } finally {
            setTransferring(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowLeftRight className="w-4 h-4 text-indigo-500" />
                        Transferir para outro Pipeline
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Pipeline de destino</Label>
                        <Select
                            value={pipelineId}
                            onValueChange={(val) => {
                                setPipelineId(val)
                                setStageId('')
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o pipeline" />
                            </SelectTrigger>
                            <SelectContent>
                                {pipelines.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {pipelineId && (
                        <div className="space-y-2">
                            <Label>Etapa de entrada</Label>
                            <Select value={stageId} onValueChange={setStageId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a etapa" />
                                </SelectTrigger>
                                <SelectContent>
                                    {pipelines
                                        .find(p => p.id === pipelineId)
                                        ?.stages.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleTransfer}
                        disabled={!pipelineId || !stageId || transferring}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {transferring ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowLeftRight className="w-4 h-4 mr-2" />}
                        Transferir
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
