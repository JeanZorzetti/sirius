'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Plus, Trash2, Loader2, FileText, HelpCircle, GitBranch,
  PlayCircle, Layers, Upload, X, Eye, EyeOff,
  Zap, MessageSquare, Calendar, Search, Home, MapPin, UserCheck, Handshake,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface KnowledgeDoc {
  id: string
  title: string
  contentType: string
  agentIds: string[]
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

interface AgentOption {
  id: string
  name: string
  gradient: string
  icon: typeof Zap
}

const ALL_AGENTS: AgentOption[] = [
  { id: 'lead-qualifier', name: 'LeadQualifier', gradient: 'from-cyan-500 to-blue-500', icon: Zap },
  { id: 'followup-coordinator', name: 'FollowUp', gradient: 'from-violet-500 to-purple-500', icon: MessageSquare },
  { id: 'deal-stage-analyzer', name: 'DealStage', gradient: 'from-amber-500 to-orange-500', icon: GitBranch },
  { id: 'meeting-scheduler', name: 'Meeting', gradient: 'from-emerald-500 to-green-500', icon: Calendar },
  { id: 'contact-enricher', name: 'Enricher', gradient: 'from-pink-500 to-rose-500', icon: Search },
  { id: 'property-matcher', name: 'PropertyMatch', gradient: 'from-indigo-500 to-blue-600', icon: Home },
  { id: 'visit-scheduler', name: 'Visit', gradient: 'from-teal-500 to-cyan-600', icon: MapPin },
  { id: 'proposal-followup', name: 'Proposal', gradient: 'from-amber-400 to-yellow-500', icon: FileText },
  { id: 'lead-profiler', name: 'Profiler', gradient: 'from-violet-500 to-indigo-500', icon: UserCheck },
  { id: 'contract-assist', name: 'Contract', gradient: 'from-rose-500 to-pink-600', icon: Handshake },
]

function typeInfo(value: string) {
  return CONTENT_TYPES.find(t => t.value === value) ?? CONTENT_TYPES[4]
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function AgentChip({ agent, selected, onClick }: { agent: AgentOption; selected: boolean; onClick: () => void }) {
  const Icon = agent.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all',
        selected
          ? 'border-transparent text-white'
          : 'border-zinc-700/60 bg-zinc-800/40 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
      )}
      style={selected ? { background: `linear-gradient(135deg, var(--tw-gradient-stops))` } : {}}
    >
      {selected && (
        <span
          className={cn('inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-white/20')}
        >
          <Icon className="h-2.5 w-2.5" />
        </span>
      )}
      {!selected && <Icon className="h-3 w-3" />}
      {agent.name}
    </button>
  )
}

// Simple gradient-aware chip using inline style
function AgentChipStyled({ agent, selected, onClick }: { agent: AgentOption; selected: boolean; onClick: () => void }) {
  const Icon = agent.icon
  const gradientColors: Record<string, string> = {
    'from-cyan-500 to-blue-500': 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    'from-violet-500 to-purple-500': 'linear-gradient(135deg, #8b5cf6, #a855f7)',
    'from-amber-500 to-orange-500': 'linear-gradient(135deg, #f59e0b, #f97316)',
    'from-emerald-500 to-green-500': 'linear-gradient(135deg, #10b981, #22c55e)',
    'from-pink-500 to-rose-500': 'linear-gradient(135deg, #ec4899, #f43f5e)',
    'from-indigo-500 to-blue-600': 'linear-gradient(135deg, #6366f1, #2563eb)',
    'from-teal-500 to-cyan-600': 'linear-gradient(135deg, #14b8a6, #0891b2)',
    'from-amber-400 to-yellow-500': 'linear-gradient(135deg, #fbbf24, #eab308)',
    'from-violet-500 to-indigo-500': 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    'from-rose-500 to-pink-600': 'linear-gradient(135deg, #f43f5e, #db2777)',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all',
        selected
          ? 'border-transparent text-white'
          : 'border-zinc-700/60 bg-zinc-800/40 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
      )}
      style={selected ? { background: gradientColors[agent.gradient] ?? '#334155', borderColor: 'transparent' } : {}}
    >
      <Icon className="h-3 w-3" />
      {agent.name}
    </button>
  )
}

export function IAKnowledge() {
  const tCommon = useTranslations('common')
  const [docs, setDocs] = useState<KnowledgeDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [contentType, setContentType] = useState('script')
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // Content tab
  const [tab, setTab] = useState<'text' | 'file'>('text')
  const [content, setContent] = useState('')

  // File upload state
  const [file, setFile] = useState<File | null>(null)
  const [extractedPreview, setExtractedPreview] = useState<string | null>(null)
  const [extractedWordCount, setExtractedWordCount] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/ia/knowledge')
      .then(r => r.json())
      .then(d => setDocs(d.documents || []))
      .catch(() => toast.error('Erro ao carregar documentos.'))
      .finally(() => setLoading(false))
  }, [])

  function resetModal() {
    setTitle('')
    setContent('')
    setContentType('script')
    setSelectedAgentIds([])
    setTab('text')
    setFile(null)
    setExtractedPreview(null)
    setExtractedWordCount(0)
    setShowPreview(false)
  }

  function toggleAgent(id: string) {
    setSelectedAgentIds(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  function handleFileSelect(f: File) {
    const MAX = 5 * 1024 * 1024
    if (f.size > MAX) {
      toast.error('Arquivo muito grande. Máximo: 5 MB.')
      return
    }
    const ext = f.name.toLowerCase()
    if (!ext.endsWith('.pdf') && !ext.endsWith('.docx') && !ext.endsWith('.txt') && !ext.endsWith('.md') && !ext.endsWith('.csv')) {
      toast.error('Formato não suportado. Use PDF, DOCX ou TXT.')
      return
    }
    setFile(f)
    setExtractedPreview(null)
    setExtractedWordCount(0)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }

  async function handleCreate() {
    if (!title.trim()) {
      toast.error('Título é obrigatório.')
      return
    }
    if (tab === 'text' && !content.trim()) {
      toast.error('Conteúdo é obrigatório.')
      return
    }
    if (tab === 'file' && !file) {
      toast.error('Selecione um arquivo.')
      return
    }

    setSaving(true)
    try {
      let res: Response

      if (tab === 'file' && file) {
        const fd = new FormData()
        fd.append('title', title.trim())
        fd.append('contentType', contentType)
        fd.append('agentIds', JSON.stringify(selectedAgentIds))
        fd.append('file', file)
        res = await fetch('/api/ia/knowledge', { method: 'POST', body: fd })
      } else {
        res = await fetch('/api/ia/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), content: content.trim(), contentType, agentIds: selectedAgentIds }),
        })
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro desconhecido')
      }

      const data = await res.json()
      setDocs(prev => [{ ...data.document, agentIds: selectedAgentIds, _count: { chunks: 0 } }, ...prev])
      setShowModal(false)
      resetModal()
      toast.success('Documento criado. Indexação em andamento...')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar documento.')
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

  const gradientColors: Record<string, string> = {
    'from-cyan-500 to-blue-500': 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    'from-violet-500 to-purple-500': 'linear-gradient(135deg, #8b5cf6, #a855f7)',
    'from-amber-500 to-orange-500': 'linear-gradient(135deg, #f59e0b, #f97316)',
    'from-emerald-500 to-green-500': 'linear-gradient(135deg, #10b981, #22c55e)',
    'from-pink-500 to-rose-500': 'linear-gradient(135deg, #ec4899, #f43f5e)',
    'from-indigo-500 to-blue-600': 'linear-gradient(135deg, #6366f1, #2563eb)',
    'from-teal-500 to-cyan-600': 'linear-gradient(135deg, #14b8a6, #0891b2)',
    'from-amber-400 to-yellow-500': 'linear-gradient(135deg, #fbbf24, #eab308)',
    'from-violet-500 to-indigo-500': 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    'from-rose-500 to-pink-600': 'linear-gradient(135deg, #f43f5e, #db2777)',
  }

  function getAgentBadges(agentIds: string[]) {
    if (!agentIds || agentIds.length === 0) return null
    return agentIds.slice(0, 3).map(id => {
      const ag = ALL_AGENTS.find(a => a.id === id)
      if (!ag) return null
      const Icon = ag.icon
      return (
        <span
          key={id}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white"
          style={{ background: gradientColors[ag.gradient] ?? '#334155' }}
        >
          <Icon className="h-2.5 w-2.5" />
          {ag.name}
        </span>
      )
    })
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
          {tCommon('buttons.add')}
        </Button>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 mb-6">
        <div className="flex items-start gap-3">
          <BookOpen className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-400">
            Quando um agente executa, ele busca os trechos mais relevantes da sua base e os injeta no raciocínio automaticamente.
            Documentos sem agente associado ficam disponíveis para todos. Adicione scripts, FAQs, processos e playbooks.
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
            const badges = getAgentBadges(doc.agentIds)
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
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[11px] text-zinc-600">{type.label}</span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-[11px] text-zinc-600">
                        {doc._count.chunks > 0 ? `${doc._count.chunks} chunks` : 'indexando...'}
                      </span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-[11px] text-zinc-600">{timeAgo(doc.createdAt)}</span>
                      {badges ? (
                        <>
                          <span className="text-zinc-700">·</span>
                          <div className="flex items-center gap-1 flex-wrap">{badges}</div>
                          {doc.agentIds.length > 3 && (
                            <span className="text-[10px] text-zinc-600">+{doc.agentIds.length - 3}</span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-zinc-700">·</span>
                          <span className="text-[11px] text-emerald-500/70">Global</span>
                        </>
                      )}
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
      <Dialog open={showModal} onOpenChange={open => { setShowModal(open); if (!open) resetModal() }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Novo Documento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Título</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Script de Qualificação BANT"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-cyan-500"
              />
            </div>

            {/* Type */}
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

            {/* Agent multi-select */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-zinc-400">Agentes associados</Label>
                <span className="text-[11px] text-zinc-600">
                  {selectedAgentIds.length === 0 ? 'Global — todos os agentes' : `${selectedAgentIds.length} selecionado${selectedAgentIds.length > 1 ? 's' : ''}`}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/50">
                {ALL_AGENTS.map(agent => (
                  <AgentChipStyled
                    key={agent.id}
                    agent={agent}
                    selected={selectedAgentIds.includes(agent.id)}
                    onClick={() => toggleAgent(agent.id)}
                  />
                ))}
              </div>
              <p className="text-[11px] text-zinc-600">
                Nenhum selecionado = disponível para todos os agentes.
              </p>
            </div>

            {/* Content tab toggle */}
            <div className="space-y-2">
              <div className="flex rounded-lg bg-zinc-800/60 p-0.5 gap-0.5">
                <button
                  type="button"
                  onClick={() => setTab('text')}
                  className={cn(
                    'flex-1 text-xs font-medium py-1.5 rounded-md transition-all',
                    tab === 'text' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-400'
                  )}
                >
                  Texto
                </button>
                <button
                  type="button"
                  onClick={() => setTab('file')}
                  className={cn(
                    'flex-1 text-xs font-medium py-1.5 rounded-md transition-all',
                    tab === 'file' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-400'
                  )}
                >
                  Arquivo
                </button>
              </div>

              <AnimatePresence mode="wait">
                {tab === 'text' ? (
                  <motion.div
                    key="text"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-1"
                  >
                    <Textarea
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      placeholder="Cole aqui o script, FAQ, processo ou qualquer texto que os agentes devem consultar..."
                      rows={7}
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-cyan-500 resize-none text-sm"
                    />
                    <p className="text-[11px] text-zinc-600">
                      {wordCount(content)} palavras — será dividido em chunks e indexado automaticamente.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="file"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-2"
                  >
                    {!file ? (
                      <div
                        onDragOver={e => { e.preventDefault(); setDragging(true) }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer py-10 transition-all',
                          dragging
                            ? 'border-cyan-500/60 bg-cyan-500/5'
                            : 'border-zinc-700/60 hover:border-zinc-600/80 hover:bg-zinc-800/30'
                        )}
                      >
                        <div className={cn(
                          'h-10 w-10 rounded-full flex items-center justify-center transition-all',
                          dragging ? 'bg-cyan-500/20' : 'bg-zinc-800'
                        )}>
                          <Upload className={cn('h-5 w-5', dragging ? 'text-cyan-400' : 'text-zinc-500')} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-zinc-300">
                            {dragging ? 'Solte o arquivo aqui' : 'Arraste ou clique para selecionar'}
                          </p>
                          <p className="text-[11px] text-zinc-600 mt-1">PDF, DOCX, TXT, MD, CSV — máx. 5 MB</p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.docx,.txt,.md,.csv"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0]
                            if (f) handleFileSelect(f)
                          }}
                        />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-zinc-700/60 bg-zinc-800/40 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-zinc-700/60 flex items-center justify-center shrink-0">
                              <FileText className="h-4 w-4 text-zinc-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-200 truncate">{file.name}</p>
                              <p className="text-[11px] text-zinc-500">{(file.size / 1024).toFixed(0)} KB</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setShowPreview(v => !v)}
                              disabled={!extractedPreview}
                              className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-zinc-700/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setFile(null); setExtractedPreview(null); setExtractedWordCount(0) }}
                              className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        {extractedPreview && extractedWordCount > 0 && (
                          <p className="text-[11px] text-emerald-400/80">
                            ~{extractedWordCount} palavras extraídas — será indexado automaticamente
                          </p>
                        )}
                        {showPreview && extractedPreview && (
                          <div className="rounded-lg bg-zinc-900/60 border border-zinc-700/40 p-2.5 max-h-32 overflow-y-auto">
                            <p className="text-[11px] text-zinc-400 font-mono leading-relaxed whitespace-pre-wrap">
                              {extractedPreview}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setShowModal(false); resetModal() }}
              className="text-zinc-400 hover:bg-zinc-800"
            >
              {tCommon('buttons.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={saving}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold gap-1.5"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {tCommon('buttons.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
