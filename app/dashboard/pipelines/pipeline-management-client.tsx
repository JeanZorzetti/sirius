'use client'

import { useState } from 'react'
import { Plus, Star, Pencil, Trash2, MoreHorizontal, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { createPipeline, updatePipeline, deletePipeline, setDefaultPipeline } from './actions'
import { toast } from 'sonner'

type Pipeline = {
  id: string
  name: string
  isDefault: boolean
  createdAt: Date
  _count: {
    stages: number
    deals: number
  }
}

type PipelineManagementClientProps = {
  pipelines: Pipeline[]
  isPro: boolean
}

export function PipelineManagementClient({ pipelines: initialPipelines, isPro }: PipelineManagementClientProps) {
  const router = useRouter()
  const [pipelines] = useState<Pipeline[]>(initialPipelines)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null)
  const [pipelineName, setPipelineName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCreate = async () => {
    if (!pipelineName.trim()) {
      toast.error('Nome do pipeline é obrigatório')
      return
    }

    setIsLoading(true)
    const result = await createPipeline(pipelineName)
    setIsLoading(false)

    if (result.success) {
      toast.success('Pipeline criado com sucesso')
      setIsCreateDialogOpen(false)
      setPipelineName('')
      router.refresh()
    } else {
      // Check if it's a plan limit error
      if ('code' in result && result.code === 'PLAN_LIMIT_REACHED') {
        toast.error(result.error || 'Limite do plano atingido')
        setIsCreateDialogOpen(false)
        // Redirect to billing page
        router.push('/dashboard/billing')
      } else {
        toast.error(result.error || 'Erro ao criar pipeline')
      }
    }
  }

  const handleUpdate = async () => {
    if (!selectedPipeline || !pipelineName.trim()) {
      toast.error('Nome do pipeline é obrigatório')
      return
    }

    setIsLoading(true)
    const result = await updatePipeline(selectedPipeline.id, pipelineName)
    setIsLoading(false)

    if (result.success) {
      toast.success('Pipeline atualizado com sucesso')
      setIsEditDialogOpen(false)
      setSelectedPipeline(null)
      setPipelineName('')
      router.refresh()
    } else {
      toast.error(result.error || 'Erro ao atualizar pipeline')
    }
  }

  const handleDelete = async () => {
    if (!selectedPipeline) return

    setIsLoading(true)
    const result = await deletePipeline(selectedPipeline.id)
    setIsLoading(false)

    if (result.success) {
      toast.success('Pipeline deletado com sucesso')
      setIsDeleteDialogOpen(false)
      setSelectedPipeline(null)
      router.refresh()
    } else {
      toast.error(result.error || 'Erro ao deletar pipeline')
    }
  }

  const handleSetDefault = async (pipelineId: string) => {
    setIsLoading(true)
    const result = await setDefaultPipeline(pipelineId)
    setIsLoading(false)

    if (result.success) {
      toast.success('Pipeline padrão definido com sucesso')
      router.refresh()
    } else {
      toast.error(result.error || 'Erro ao definir pipeline padrão')
    }
  }

  const openEditDialog = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline)
    setPipelineName(pipeline.name)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline)
    setIsDeleteDialogOpen(true)
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-muted-foreground">
          {pipelines.length} {pipelines.length === 1 ? 'pipeline' : 'pipelines'}
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Pipeline
          {!isPro && pipelines.length >= 1 && (
            <Badge variant="secondary" className="ml-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
              PRO
            </Badge>
          )}
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Etapas</TableHead>
              <TableHead>Negócios</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pipelines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
                      <GitBranch className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="font-medium">Nenhum pipeline encontrado</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Crie seu primeiro pipeline para organizar seus negócios.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pipelines.map((pipeline) => (
                <TableRow key={pipeline.id} data-pipeline-id={pipeline.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {pipeline.name}
                      {pipeline.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Padrão
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{pipeline._count.stages}</TableCell>
                  <TableCell>{pipeline._count.deals}</TableCell>
                  <TableCell>
                    {pipeline.isDefault ? (
                      <Badge variant="default" className="bg-blue-500">
                        <Star className="h-3 w-3 mr-1" />
                        Padrão
                      </Badge>
                    ) : (
                      <Badge variant="outline">Secundário</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(pipeline)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {!pipeline.isDefault && (
                          <DropdownMenuItem onClick={() => handleSetDefault(pipeline.id)}>
                            <Star className="h-4 w-4 mr-2" />
                            Definir como Padrão
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(pipeline)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Pipeline</DialogTitle>
            <DialogDescription>
              Adicione um novo pipeline para organizar seus negócios de forma diferente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Pipeline</Label>
              <Input
                id="name"
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                placeholder="Ex: Vendas Corporativas"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Pipeline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pipeline</DialogTitle>
            <DialogDescription>
              Atualize o nome do pipeline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do Pipeline</Label>
              <Input
                id="edit-name"
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                placeholder="Ex: Vendas Corporativas"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdate()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Pipeline</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPipeline && selectedPipeline._count.deals > 0 ? (
                <>
                  Este pipeline contém <strong>{selectedPipeline._count.deals}</strong>{' '}
                  {selectedPipeline._count.deals === 1 ? 'negócio' : 'negócios'}.
                  <br />
                  <br />
                  Você precisa mover ou deletar os negócios antes de deletar este pipeline.
                </>
              ) : selectedPipeline?.isDefault ? (
                <>
                  Este é o pipeline padrão.
                  <br />
                  <br />
                  Defina outro pipeline como padrão antes de deletar este.
                </>
              ) : (
                <>
                  Tem certeza que deseja deletar o pipeline <strong>{selectedPipeline?.name}</strong>?
                  <br />
                  <br />
                  Esta ação não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {selectedPipeline &&
              selectedPipeline._count.deals === 0 &&
              !selectedPipeline.isDefault && (
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Deletando...' : 'Deletar Pipeline'}
                </AlertDialogAction>
              )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
