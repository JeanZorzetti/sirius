'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Plus, Trash2, Loader2, FileText, HelpCircle, GitBranch, PlayCircle, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface KnowledgeDoc {
  id: string
  title: string
  contentType: string
  createdAt: string
  _count: { chunks: number }
}

const CONTENT_TYPES = [
  { value: 'script', label: 'Script de Vendas', icon: PlayCircle, color: 'text-cyan-400' },
  { value: 'faq', label: 'FAQ', icon: HelpCircle, color: 'text-violet-400' },
  { value: 'process', label: 'Processo', icon: GitBranch, color: 'text-amber-400' },
  { value: 'playbook', label: 'Playbook', icon: BookOpen, color: 'text-emerald-400' },
  { value: 'custom', label: 'Personalizado', icon: Layers, color: 'text-zinc-400' },
]

function typeInfo(value: string) {
  return CONTENT_TYPES.find(t => t.value === value) ?? CONTENT_TYPES[4]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'hoje'
  if (days === 1) return 'ontem'
  return `${days}d atrás`
}

export function IAKnowledge() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState('script')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/ia/knowledge')
      .then(r => r.json())
      .then(d => setDocs(d.documents || []))
      .catch(() => toast.error('Erro ao carregar documentos.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!title.trim() || !content.trim()) {
      toast.error('Título e conteúdo são obrigatórios.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/ia/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, contentType }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      // The chunks are embedded in background — show optimistic count 0
      setDocs(prev => [{
        ...data.document,
        _count: { chunks: 0 },
      }, ...prev])
      setShowModal(false)
      setTitle('')
      setContent('')
      setContentType('script')
      toast.success('Documento criado. Indexação em andamento...')
    } catch {
      toast.error('Erro ao criar documento.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/ia/knowledge/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setDocs(prev => prev.filter(d => d.id !== id))
      toast('Documento removido.')
    } catch {
      toast.error('Erro ao remover documento.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Base de Conhecimento</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Documentos que os agentes consultam ao raciocinar sobre leads e deals.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowModal(true)}
          className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 mb-6">
        <div className="flex items-start gap-3">
          <BookOpen className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-400">
            Quando um agente executa, ele busca os trechos mais relevantes da sua base de conhecimento e os injeta no raciocínio automaticamente. Adicione scripts de vendas, FAQs do produto, processos e playbooks.
          </p>
        </div>
      </div>

      {/* Document list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 text-zinc-500 animate-spin" />
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-12 w-12 rounded-full bg-zinc-800/60 flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-zinc-600" />
          </div>
          <p className="text-zinc-400 font-medium mb-1">Nenhum documento ainda</p>
          <p className="text-xs text-zinc-600 max-w-xs">
            Adicione um script de vendas ou FAQ para que os agentes usem como referência ao responder leads.
          </p>
          <Button
            size="sm"
            onClick={() => setShowModal(true)}
            className="mt-4 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Criar primeiro documento
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc, i) => {
            const type = typeInfo(doc.contentType)
            const TypeIcon = type.icon
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group flex items-center justify-between gap-4 rounded-xl border border-zinc-800/40 bg-zinc-900/40 px-4 py-3.5 hover:border-zinc-700/60 hover:bg-zinc-900/60 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/60 shrink-0">
                    <TypeIcon className={cn('h-4 w-4', type.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-zinc-600">{type.label}</span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-[11px] text-zinc-600">
                        {doc._count.chunks > 0 ? `${doc._count.chunks} chunks` : 'indexando...'}
                      </span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-[11px] text-zinc-600">{timeAgo(doc.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleting === doc.id}
                  className="shrink-0 p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                >
                  {deleting === doc.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />
                  }
                </button>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Create modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Novo Documento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Título</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Script de Qualificação BANT"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Tipo</Label>
              <div className="grid grid-cols-5 gap-1.5">
                {CONTENT_TYPES.map(t => {
                  const Icon = t.icon
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setContentType(t.value)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-lg border text-[10px] font-medium transition-all',
                        contentType === t.value
                          ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                          : 'border-zinc-700/50 bg-zinc-800/40 text-zinc-500 hover:border-zinc-600/60 hover:text-zinc-400'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {t.label.split(' ')[0]}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Conteúdo</Label>
              <Textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Cole aqui o script, FAQ, processo ou qualquer texto que os agentes devem consultar..."
                rows={8}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-cyan-500 resize-none text-sm"
              />
              <p className="text-[11px] text-zinc-600">
                {content.trim().split(/\s+/).filter(Boolean).length} palavras — será dividido em chunks e indexado automaticamente.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowModal(false)} className="text-zinc-400 hover:bg-zinc-800">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={saving}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold gap-1.5"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Salvar e indexar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
