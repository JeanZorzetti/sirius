'use client'

/**
 * DealFormGenerator - Dynamic Deal Creation Form
 *
 * Creates deals with AI-prefilled data from conversation context.
 *
 * Features:
 * - Auto-prefill from conversation context
 * - Suggested tags (clickable chips)
 * - AI-generated notes
 * - Quick create mode (fewer fields)
 * - Validation with visual feedback
 */

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import type { DealFormGeneratorProps } from '@/lib/generative-ui/schemas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Briefcase,
  DollarSign,
  Calendar,
  Tag,
  FileText,
  Sparkles,
  CheckCircle,
  Loader2,
  X,
  Plus
} from 'lucide-react'

// Form validation schema
const dealFormSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  value: z.number().positive('Valor deve ser positivo').optional(),
  closeDate: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

type DealFormData = z.infer<typeof dealFormSchema>

interface DealFormGeneratorComponentProps extends DealFormGeneratorProps {
  onInteraction?: (action: string, component: string, data: Record<string, unknown>) => void
}

export function DealFormGenerator({
  prefill,
  suggestedTags = [],
  aiNotes,
  quickCreate = false,
  onInteraction
}: DealFormGeneratorComponentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>(suggestedTags.slice(0, 3))
  const [customTag, setCustomTag] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<DealFormData>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      title: prefill?.title || '',
      value: prefill?.value,
      closeDate: prefill?.closeDate || '',
      notes: aiNotes || '',
      tags: selectedTags,
    }
  })

  const notes = watch('notes')

  // Handle tag toggle
  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
      setValue('tags', newTags)
      return newTags
    })
  }, [setValue])

  // Handle custom tag add
  const addCustomTag = useCallback(() => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      const newTag = customTag.trim()
      setSelectedTags(prev => {
        const newTags = [...prev, newTag]
        setValue('tags', newTags)
        return newTags
      })
      setCustomTag('')
    }
  }, [customTag, selectedTags, setValue])

  // Handle form submission
  const onSubmit = async (data: DealFormData) => {
    setIsSubmitting(true)

    try {
      // Call API to create deal
      const response = await fetch('/api/v1/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          value: data.value || 0,
          closeDate: data.closeDate || null,
          notes: data.notes,
          tags: selectedTags,
          pipelineId: prefill?.pipelineId,
          stageId: prefill?.stageId,
          contactId: prefill?.contactId,
        }),
      })

      if (response.ok) {
        const deal = await response.json()
        setIsSuccess(true)
        onInteraction?.('deal_created', 'DealFormGenerator', {
          dealId: deal.id,
          title: data.title,
          value: data.value,
          tags: selectedTags,
        })

        // Reset after success animation
        setTimeout(() => setIsSuccess(false), 3000)
      } else {
        throw new Error('Failed to create deal')
      }
    } catch (error) {
      console.error('Error creating deal:', error)
      onInteraction?.('deal_creation_failed', 'DealFormGenerator', {
        error: String(error),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        data-testid="deal-form-success"
      >
        <Card className="border-2 border-green-500/50 bg-green-50 dark:bg-green-950/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            </motion.div>
            <h3 className="text-xl font-semibold text-green-700 dark:text-green-400 mb-2">
              Deal Criado com Sucesso!
            </h3>
            <p className="text-muted-foreground text-center">
              O negócio foi adicionado ao seu pipeline.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="deal-form-generator"
    >
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {quickCreate ? 'Criar Deal Rápido' : 'Novo Negócio'}
              </CardTitle>
              <CardDescription>
                {aiNotes ? (
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Dados pré-preenchidos pela IA
                  </span>
                ) : (
                  'Preencha os dados do negócio'
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Título do Negócio *
              </Label>
              <Input
                id="title"
                placeholder="Ex: Implementação Sirius CRM - Empresa XYZ"
                {...register('title')}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Value & Close Date - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Valor Estimado
                </Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="0"
                  {...register('value', { valueAsNumber: true })}
                />
                {prefill?.value && (
                  <p className="text-xs text-muted-foreground">
                    Sugerido: {formatCurrency(prefill.value)}
                  </p>
                )}
              </div>

              {!quickCreate && (
                <div className="space-y-2">
                  <Label htmlFor="closeDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Data de Fechamento
                  </Label>
                  <Input
                    id="closeDate"
                    type="date"
                    {...register('closeDate')}
                  />
                </div>
              )}
            </div>

            {/* Suggested Tags */}
            {suggestedTags.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Tags Sugeridas
                </Label>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer transition-all hover:scale-105"
                      onClick={() => toggleTag(tag)}
                    >
                      {selectedTags.includes(tag) && (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      )}
                      {tag}
                    </Badge>
                  ))}

                  {/* Custom tag input */}
                  <div className="flex items-center gap-1">
                    <Input
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                      placeholder="Nova tag..."
                      className="h-7 w-24 text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={addCustomTag}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Selected tags display */}
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Notes */}
            {!quickCreate && (
              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Notas
                  {aiNotes && (
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      IA
                    </Badge>
                  )}
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Adicione observações sobre o negócio..."
                  rows={3}
                  {...register('notes')}
                  className="resize-none"
                />
                {notes && (
                  <p className="text-xs text-muted-foreground text-right">
                    {notes.length} caracteres
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Criar Negócio
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default DealFormGenerator
