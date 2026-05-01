'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Sparkles, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'
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

const TOPIC_SUGGESTIONS = [
  'Follow-up automático com clientes',
  'Pipeline de vendas para corretores',
  'Métricas que todo corretor deve acompanhar',
  'Como organizar sua carteira de clientes',
  'Fechar mais negócios com IA',
  'Gestão de tempo para corretores de sucesso',
]

export function NewPostModal({ open, onClose, onCreated, preselectedDate }: Props) {
  const [type, setType] = useState<PostType>('feed')
  const [topic, setTopic] = useState('')
  const [step, setStep] = useState<'form' | 'preview'>('form')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<InstagramPost | null>(null)
  const [error, setError] = useState('')

  function buildPromptFromTopic(t: string, postType: string) {
    return {
      imagePrompt: `Instagram post for Sirius CRM software. Dark background with purple and blue gradient. A glowing 4-pointed star logo (purple to blue gradient) top left corner with text "SIRIUS CRM". Bold white text in Portuguese about: "${t}". Professional SaaS design, laptop and mobile mockup showing CRM dashboard. Minimalist modern style.`,
      caption: `✨ ${t}\n\nCom o Sirius CRM, corretores de imóveis têm tudo que precisam para vender mais e se organizar melhor. Inteligência artificial + automação ao seu favor.\n\n👉 Teste grátis em siriuscrm.com.br`,
      hashtags: '#SiriusCRM #CRMImobiliario #CorretorDeImoveis #Automacao #VendasImobiliarias #TechImob #ImobiliariaDigital #CRM',
      altText: `Post do Sirius CRM sobre ${t}`,
      slides: postType === 'carousel' ? [
        `${t} 🚀`,
        'Problema: tempo perdido com follow-ups manuais',
        'Solução: automação inteligente com IA',
        'Resultado: +31% de negócios fechados',
        '➡️ Teste grátis em siriuscrm.com.br',
      ] : [],
    }
  }

  async function handleGenerate() {
    if (!topic.trim()) { setError('Descreva o tema do post'); return }
    setError('')
    setLoading(true)

    const payload = buildPromptFromTopic(topic, type)

    try {
      const body: Record<string, unknown> = { type, ...payload }
      if (preselectedDate) {
        const d = new Date(preselectedDate)
        d.setHours(9, 0, 0, 0)
        body.scheduledFor = d.toISOString()
      }
      const res = await fetch('/api/instagram/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar post')
      setPreview(data)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  function handleConfirm() {
    if (preview) {
      onCreated(preview)
      handleClose()
    }
  }

  function handleClose() {
    setStep('form')
    setTopic('')
    setPreview(null)
    setError('')
    onClose()
  }

  const scheduledDate = preview ? new Date(preview.scheduledFor).toLocaleString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }) : ''

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            {step === 'form' ? 'Novo Post' : 'Preview'}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4 pt-2"
            >
              <div className="flex flex-col gap-2">
                <Label>Tipo de post</Label>
                <Select value={type} onValueChange={v => setType(v as PostType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feed">Feed (1 imagem)</SelectItem>
                    <SelectItem value="carousel">Carrossel (5 slides)</SelectItem>
                    <SelectItem value="stories">Stories (9:16)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Tema / assunto do post</Label>
                <Textarea
                  placeholder="Ex: Como o follow-up automático ajuda corretores a fechar mais negócios..."
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  rows={3}
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {TOPIC_SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => setTopic(s)}
                      className="text-xs px-2 py-1 rounded-full border border-border hover:border-purple-500 hover:text-purple-400 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <Button onClick={handleGenerate} disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando com GPT Image 2...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Gerar Post</>
                )}
              </Button>
            </motion.div>
          )}

          {step === 'preview' && preview && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4 pt-2"
            >
              {/* Image preview */}
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted">
                {preview.imageUrls[0] ? (
                  <Image src={preview.imageUrls[0]} alt="Preview" fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-10 w-10 opacity-30" />
                  </div>
                )}
                {preview.imageUrls.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                    {preview.imageUrls.length} slides
                  </div>
                )}
              </div>

              {/* Caption */}
              <div className="flex flex-col gap-1">
                <p className="text-sm text-foreground/80 whitespace-pre-wrap line-clamp-4">{preview.caption}</p>
                <p className="text-xs text-purple-400/70">{preview.hashtags}</p>
              </div>

              {/* Schedule info + best-time hint */}
              <div className="flex flex-col gap-2">
                <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                  📅 Agendado para: <span className="text-foreground font-medium">{scheduledDate}</span>
                </div>
                <BestTimeHint scheduledFor={preview.scheduledFor} postType={preview.type as PostType} />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>
                  Voltar
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  onClick={handleConfirm}>
                  Confirmar e Agendar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
