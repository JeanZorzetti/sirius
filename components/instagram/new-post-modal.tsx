'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Sparkles, Upload, ChevronRight, ChevronLeft, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ImageUploader } from './image-uploader'
import { BestTimeHint } from './best-time-hint'
import type { PostType } from '@/lib/instagram/scheduling'

interface InstagramPost {
  id: string
  type: string
  caption: string
  hashtags: string
  altText: string
  imageUrls: string[]
  slides: string[]
  scheduledFor: string
  status: string
  postedAt: string | null
  error: string | null
  createdAt: string
}

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (post: InstagramPost) => void
  preselectedDate?: Date
}

type Source = 'ai' | 'upload'
type Step = 1 | 2 | 3

const TYPE_OPTIONS: { value: PostType; label: string; desc: string }[] = [
  { value: 'feed',     label: 'Feed',      desc: '1 imagem · proporção 1:1 ou 4:5' },
  { value: 'carousel', label: 'Carrossel', desc: 'Até 10 imagens · swipeable' },
  { value: 'stories',  label: 'Stories',   desc: '1 imagem · proporção 9:16' },
]

const TOPIC_SUGGESTIONS = [
  'Follow-up automático com clientes',
  'Pipeline de vendas para corretores',
  'Métricas que todo corretor deve acompanhar',
  'Como organizar sua carteira de clientes',
  'Fechar mais negócios com IA',
  'Gestão de tempo para corretores de sucesso',
]

const STEP_LABELS: Record<Step, string> = {
  1: 'Tipo e imagem',
  2: 'Conteúdo',
  3: 'Agendamento',
}

export function NewPostModal({ open, onClose, onCreated, preselectedDate }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [type, setType] = useState<PostType>('feed')
  const [source, setSource] = useState<Source>('ai')

  // Upload flow
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])

  // AI flow
  const [topic, setTopic] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([])

  // Content (step 2)
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [altText, setAltText] = useState('')

  // Schedule (step 3)
  const [scheduledFor, setScheduledFor] = useState(() => {
    const d = preselectedDate ? new Date(preselectedDate) : new Date()
    d.setHours(9, 0, 0, 0)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const imageUrls = source === 'upload' ? uploadedUrls : generatedImageUrls
  const maxImages = type === 'carousel' ? 10 : 1

  // Step 1 → 2: generate AI images if source=ai, else just advance
  async function handleStep1Next() {
    setError('')

    if (source === 'ai') {
      if (!topic.trim()) { setError('Descreva o tema do post'); return }
      setGenerating(true)
      try {
        const imagePrompt = `Instagram post for Sirius CRM software. Dark background with purple and blue gradient. A glowing 4-pointed star logo top left with text "SIRIUS CRM". Bold white text in Portuguese about: "${topic}". Professional SaaS design. Minimalist modern style.`
        const res = await fetch('/api/instagram/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            imagePrompt,
            caption: `✨ ${topic}\n\nCom o Sirius CRM, corretores têm tudo que precisam para vender mais.\n\n👉 siriuscrm.com.br`,
            hashtags: '#SiriusCRM #CRMImobiliario #CorretorDeImoveis #Automacao #VendasImobiliarias',
            altText: `Post do Sirius CRM sobre ${topic}`,
            slides: type === 'carousel' ? [topic, 'Problema', 'Solução', 'Resultado', '➡️ siriuscrm.com.br'] : [],
            draftOnly: true,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erro ao gerar imagem')
        setGeneratedImageUrls(data.imageUrls ?? [])
        setCaption(data.caption ?? '')
        setHashtags(data.hashtags ?? '')
        setAltText(data.altText ?? '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        setGenerating(false)
        return
      }
      setGenerating(false)
    } else {
      if (uploadedUrls.length === 0) { setError('Faça upload de ao menos uma imagem'); return }
    }

    setStep(2)
  }

  function handleStep2Next() {
    if (!caption.trim()) { setError('Escreva uma legenda'); return }
    setError('')
    setStep(3)
  }

  async function handleSave() {
    setError('')
    setSaving(true)
    try {
      const scheduledISO = new Date(scheduledFor).toISOString()
      const res = await fetch('/api/instagram/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          caption,
          hashtags,
          altText,
          imageUrls,
          slides: [],
          scheduledFor: scheduledISO,
          status: 'draft',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar post')
      onCreated(data)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    setStep(1)
    setType('feed')
    setSource('ai')
    setTopic('')
    setUploadedUrls([])
    setGeneratedImageUrls([])
    setCaption('')
    setHashtags('')
    setAltText('')
    setError('')
    onClose()
  }

  const stepVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 20 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -20 }),
  }

  // direction: forward = 1, back = -1
  const [dir, setDir] = useState(1)

  function goBack() {
    setDir(-1)
    setError('')
    setStep(s => (s - 1) as Step)
  }

  function goNext() {
    setDir(1)
    if (step === 1) handleStep1Next()
    else if (step === 2) handleStep2Next()
    else handleSave()
  }

  const previewUrl = imageUrls[0]

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-purple-400" />
            Novo Post
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-5 pt-3 pb-0">
          {([1, 2, 3] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-0 flex-1">
              <div className={`flex items-center gap-1.5 ${step >= s ? 'text-purple-400' : 'text-muted-foreground/40'}`}>
                <div className={`w-5 h-5 rounded-full border text-[10px] font-bold flex items-center justify-center transition-colors
                  ${step === s ? 'border-purple-500 bg-purple-500/20 text-purple-400' : step > s ? 'border-purple-500/50 bg-purple-500/10' : 'border-border'}
                `}>
                  {s}
                </div>
                <span className="text-[11px] hidden sm:inline">{STEP_LABELS[s]}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px mx-2 ${step > s ? 'bg-purple-500/40' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="overflow-hidden px-5 pb-5 pt-4 min-h-[340px]">
          <AnimatePresence mode="wait" custom={dir}>
            {/* Step 1: tipo + fonte */}
            {step === 1 && (
              <motion.div key="step1" custom={dir} variants={stepVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.18 }}
                className="flex flex-col gap-4"
              >
                {/* Post type */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Tipo de post</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {TYPE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setType(opt.value)}
                        className={`rounded-xl border p-3 text-left transition-all
                          ${type === opt.value ? 'border-purple-500 bg-purple-500/10' : 'border-border hover:border-purple-500/40'}
                        `}
                      >
                        <p className="text-xs font-medium">{opt.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Source */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Fonte da imagem</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSource('ai')}
                      className={`rounded-xl border p-3 flex items-center gap-2 transition-all
                        ${source === 'ai' ? 'border-purple-500 bg-purple-500/10' : 'border-border hover:border-purple-500/40'}
                      `}
                    >
                      <Sparkles className={`h-4 w-4 ${source === 'ai' ? 'text-purple-400' : 'text-muted-foreground'}`} />
                      <div className="text-left">
                        <p className="text-xs font-medium">Gerar com IA</p>
                        <p className="text-[10px] text-muted-foreground">GPT Image 2</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setSource('upload')}
                      className={`rounded-xl border p-3 flex items-center gap-2 transition-all
                        ${source === 'upload' ? 'border-purple-500 bg-purple-500/10' : 'border-border hover:border-purple-500/40'}
                      `}
                    >
                      <Upload className={`h-4 w-4 ${source === 'upload' ? 'text-purple-400' : 'text-muted-foreground'}`} />
                      <div className="text-left">
                        <p className="text-xs font-medium">Upload manual</p>
                        <p className="text-[10px] text-muted-foreground">Com crop</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* AI topic input */}
                {source === 'ai' && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Tema do post</Label>
                    <Textarea
                      placeholder="Ex: Como o follow-up automático ajuda corretores a fechar mais negócios..."
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      rows={2}
                      className="resize-none text-sm"
                    />
                    <div className="flex flex-wrap gap-1">
                      {TOPIC_SUGGESTIONS.map(s => (
                        <button key={s} onClick={() => setTopic(s)}
                          className="text-xs px-2 py-1 rounded-full border border-border hover:border-purple-500 hover:text-purple-400 transition-colors">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload input */}
                {source === 'upload' && (
                  <ImageUploader
                    postType={type}
                    urls={uploadedUrls}
                    onChange={setUploadedUrls}
                    maxImages={maxImages}
                  />
                )}

                {error && <p className="text-xs text-red-400">{error}</p>}
              </motion.div>
            )}

            {/* Step 2: conteúdo */}
            {step === 2 && (
              <motion.div key="step2" custom={dir} variants={stepVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.18 }}
                className="flex flex-col gap-4"
              >
                {/* Image preview strip */}
                {previewUrl && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {imageUrls.slice(0, 5).map((url, i) => (
                      <div key={i} className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {imageUrls.length > 5 && (
                      <div className="shrink-0 w-16 h-16 rounded-lg border border-border flex items-center justify-center text-xs text-muted-foreground">
                        +{imageUrls.length - 5}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs flex justify-between">
                    Legenda <span className="text-muted-foreground font-normal">{caption.length}/2200</span>
                  </Label>
                  <Textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    rows={4}
                    maxLength={2200}
                    className="resize-none text-sm"
                    placeholder="Escreva a legenda do post…"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Hashtags</Label>
                  <Input
                    value={hashtags}
                    onChange={e => setHashtags(e.target.value)}
                    placeholder="#hashtag1 #hashtag2"
                    className="text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Texto alternativo</Label>
                  <Input
                    value={altText}
                    onChange={e => setAltText(e.target.value)}
                    placeholder="Descrição da imagem para acessibilidade"
                    className="text-sm"
                  />
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}
              </motion.div>
            )}

            {/* Step 3: agendamento */}
            {step === 3 && (
              <motion.div key="step3" custom={dir} variants={stepVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.18 }}
                className="flex flex-col gap-4"
              >
                {/* Preview thumbnail + caption summary */}
                <div className="flex gap-3 rounded-xl border border-border p-3 bg-muted/30">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground/80 line-clamp-2">{caption}</p>
                    <p className="text-[10px] text-purple-400/70 mt-1 truncate">{hashtags}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Data e hora (Brasília)</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={e => setScheduledFor(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <BestTimeHint
                  scheduledFor={scheduledFor ? new Date(scheduledFor).toISOString() : ''}
                  postType={type}
                />

                <div className="rounded-lg bg-muted/50 border border-border p-3 text-xs text-muted-foreground">
                  O post será salvo como <strong className="text-foreground">rascunho</strong> e precisará ser aprovado antes de ser agendado.
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-5 pb-5 pt-0 border-t border-border pt-4">
          <Button variant="ghost" size="sm" onClick={step === 1 ? handleClose : goBack}
            disabled={generating || saving}>
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </Button>

          <Button size="sm" onClick={goNext}
            disabled={generating || saving}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white min-w-[120px]">
            {generating ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Gerando…</>
            ) : saving ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Salvando…</>
            ) : step === 3 ? (
              'Salvar rascunho'
            ) : (
              <>{step === 1 && source === 'ai' && !generating ? <Sparkles className="h-3.5 w-3.5 mr-1.5" /> : null}
              Continuar <ChevronRight className="h-3.5 w-3.5 ml-1" /></>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
