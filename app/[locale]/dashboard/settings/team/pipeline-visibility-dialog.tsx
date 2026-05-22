'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Layers, Loader2, ChevronDown, ChevronRight, Lock } from "lucide-react"
import { updateUserPipelineVisibility } from "./actions"
import { toast } from "sonner"

interface PipelineStage {
    id: string
    name: string
    order: number
}

interface Pipeline {
    id: string
    name: string
    isDefault: boolean
    stages: PipelineStage[]
}

interface PipelineVisibilityDialogProps {
    userId: string
    userName: string
    pipelines: Pipeline[]
    currentRestricted: boolean
    currentAllowedIds: string[]
    currentStageRestricted: boolean
    currentAllowedStageIds: string[]
}

export function PipelineVisibilityDialog({
    userId,
    userName,
    pipelines,
    currentRestricted,
    currentAllowedIds,
    currentStageRestricted,
    currentAllowedStageIds,
}: PipelineVisibilityDialogProps) {
    const [open, setOpen] = useState(false)
    const [restricted, setRestricted] = useState(currentRestricted)
    const [selectedIds, setSelectedIds] = useState<string[]>(currentAllowedIds)
    const [stageRestricted, setStageRestricted] = useState(currentStageRestricted)
    const [selectedStageIds, setSelectedStageIds] = useState<string[]>(currentAllowedStageIds)
    const [expandedPipelines, setExpandedPipelines] = useState<string[]>([])
    const [isPending, startTransition] = useTransition()

    const togglePipeline = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
        // Remove stage selections for this pipeline if deselected
        const pipeline = pipelines.find(p => p.id === id)
        if (pipeline && selectedIds.includes(id)) {
            const stageIds = pipeline.stages.map(s => s.id)
            setSelectedStageIds(prev => prev.filter(sid => !stageIds.includes(sid)))
        }
    }

    const toggleStage = (stageId: string) => {
        setSelectedStageIds(prev =>
            prev.includes(stageId) ? prev.filter(x => x !== stageId) : [...prev, stageId]
        )
    }

    const togglePipelineExpanded = (pipelineId: string) => {
        setExpandedPipelines(prev =>
            prev.includes(pipelineId) ? prev.filter(x => x !== pipelineId) : [...prev, pipelineId]
        )
    }

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateUserPipelineVisibility(
                    userId,
                    restricted,
                    selectedIds,
                    stageRestricted,
                    selectedStageIds,
                )
                toast.success("Visibilidade atualizada")
                setOpen(false)
            } catch (e: any) {
                toast.error(e.message)
            }
        })
    }

    const handleOpenChange = (val: boolean) => {
        if (val) {
            setRestricted(currentRestricted)
            setSelectedIds(currentAllowedIds)
            setStageRestricted(currentStageRestricted)
            setSelectedStageIds(currentAllowedStageIds)
            setExpandedPipelines([])
        }
        setOpen(val)
    }

    // Pipelines where stage restrictions apply: when restricted, only selected; when unrestricted, all
    const visiblePipelines = restricted
        ? pipelines.filter(p => selectedIds.includes(p.id))
        : pipelines

    const label = currentRestricted
        ? currentAllowedIds.length === 0
            ? <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">Nenhum</Badge>
            : <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400">{currentAllowedIds.length} pipeline{currentAllowedIds.length !== 1 ? 's' : ''}</Badge>
        : <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">Todos</Badge>

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-zinc-500 hover:text-zinc-300 px-2">
                    <Layers className="h-3.5 w-3.5" />
                    {label}
                </Button>
            </DialogTrigger>

            <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Pipelines visíveis</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Defina quais pipelines <strong className="text-zinc-300">{userName}</strong> pode ver.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-3">
                    {/* Unrestricted option */}
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        !restricted
                            ? 'border-green-500/40 bg-green-500/5'
                            : 'border-zinc-800 hover:border-zinc-700'
                    }`}>
                        <Checkbox
                            checked={!restricted}
                            onCheckedChange={() => { setRestricted(false); setSelectedIds([]) }}
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />
                        <div>
                            <p className="text-sm font-medium text-zinc-200">Todos os pipelines</p>
                            <p className="text-xs text-zinc-500">Sem restrição — acessa tudo</p>
                        </div>
                    </label>

                    {/* Restricted: no pipelines */}
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        restricted && selectedIds.length === 0
                            ? 'border-red-500/40 bg-red-500/5'
                            : 'border-zinc-800 hover:border-zinc-700'
                    }`}>
                        <Checkbox
                            checked={restricted && selectedIds.length === 0}
                            onCheckedChange={() => { setRestricted(true); setSelectedIds([]); setSelectedStageIds([]) }}
                            className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                        />
                        <div>
                            <p className="text-sm font-medium text-zinc-200">Nenhum pipeline</p>
                            <p className="text-xs text-zinc-500">Usuário não verá nenhum pipeline</p>
                        </div>
                    </label>

                    {/* Individual pipelines */}
                    {pipelines.length > 0 && (
                        <div className="border border-zinc-800 rounded-lg overflow-hidden">
                            <p className="text-xs text-zinc-500 px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
                                Selecionar pipelines específicos
                            </p>
                            <div className="divide-y divide-zinc-800/60">
                                {pipelines.map(pipeline => {
                                    const isChecked = restricted && selectedIds.includes(pipeline.id)
                                    return (
                                        <label key={pipeline.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                                            isChecked ? 'bg-indigo-500/5' : 'hover:bg-zinc-900/50'
                                        }`}>
                                            <Checkbox
                                                checked={isChecked}
                                                onCheckedChange={() => {
                                                    setRestricted(true)
                                                    togglePipeline(pipeline.id)
                                                }}
                                                className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                            />
                                            <span className="text-sm text-zinc-300 flex-1">{pipeline.name}</span>
                                            {pipeline.isDefault && (
                                                <Badge variant="secondary" className="text-[10px] py-0 h-4 bg-zinc-800 text-zinc-400">
                                                    padrão
                                                </Badge>
                                            )}
                                        </label>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Stage restrictions — only shown when at least one pipeline is visible */}
                    {visiblePipelines.some(p => p.stages.length > 0) && (
                        <div className="border border-zinc-800 rounded-lg overflow-hidden">
                            {/* Header with toggle */}
                            <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
                                <Lock className="h-3 w-3 text-zinc-500" />
                                <p className="text-xs text-zinc-500 flex-1">Restringir etapas (deals visíveis)</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStageRestricted(!stageRestricted)
                                        if (stageRestricted) setSelectedStageIds([])
                                    }}
                                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                                        stageRestricted
                                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                                            : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'
                                    }`}
                                >
                                    {stageRestricted ? 'ativo' : 'desativado'}
                                </button>
                            </div>

                            {!stageRestricted ? (
                                <p className="text-xs text-zinc-600 px-3 py-3">
                                    Usuário verá deals de todas as etapas dos pipelines acima.
                                </p>
                            ) : (
                                <div className="divide-y divide-zinc-800/60">
                                    {visiblePipelines.filter(p => p.stages.length > 0).map(pipeline => {
                                        const isExpanded = expandedPipelines.includes(pipeline.id)
                                        const checkedStages = pipeline.stages.filter(s => selectedStageIds.includes(s.id))
                                        return (
                                            <div key={pipeline.id}>
                                                {/* Pipeline row — expand/collapse */}
                                                <button
                                                    type="button"
                                                    onClick={() => togglePipelineExpanded(pipeline.id)}
                                                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-zinc-900/50 transition-colors text-left"
                                                >
                                                    {isExpanded
                                                        ? <ChevronDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                                                        : <ChevronRight className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                                                    }
                                                    <span className="text-sm text-zinc-300 flex-1">{pipeline.name}</span>
                                                    {checkedStages.length > 0 ? (
                                                        <Badge variant="outline" className="text-[10px] py-0 h-4 border-amber-500/30 text-amber-400">
                                                            {checkedStages.length}/{pipeline.stages.length} etapas
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] py-0 h-4 border-zinc-700 text-zinc-500">
                                                            todas
                                                        </Badge>
                                                    )}
                                                </button>

                                                {/* Stages list */}
                                                {isExpanded && (
                                                    <div className="bg-zinc-900/30 divide-y divide-zinc-800/40">
                                                        {/* "Todas as etapas" shortcut */}
                                                        <label className="flex items-center gap-3 px-5 py-2 cursor-pointer hover:bg-zinc-900/50 transition-colors">
                                                            <Checkbox
                                                                checked={checkedStages.length === 0}
                                                                onCheckedChange={() => {
                                                                    const stageIds = pipeline.stages.map(s => s.id)
                                                                    setSelectedStageIds(prev => prev.filter(sid => !stageIds.includes(sid)))
                                                                }}
                                                                className="data-[state=checked]:bg-zinc-600 data-[state=checked]:border-zinc-600"
                                                            />
                                                            <span className="text-xs text-zinc-400 italic">Todas as etapas</span>
                                                        </label>
                                                        {pipeline.stages.map(stage => (
                                                            <label
                                                                key={stage.id}
                                                                className={`flex items-center gap-3 px-5 py-2 cursor-pointer transition-colors ${
                                                                    selectedStageIds.includes(stage.id) ? 'bg-amber-500/5' : 'hover:bg-zinc-900/50'
                                                                }`}
                                                            >
                                                                <Checkbox
                                                                    checked={selectedStageIds.includes(stage.id)}
                                                                    onCheckedChange={() => toggleStage(stage.id)}
                                                                    className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                                                                />
                                                                <span className="text-xs text-zinc-300">{stage.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">
                        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
