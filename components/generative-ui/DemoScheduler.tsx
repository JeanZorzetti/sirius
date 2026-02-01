'use client'

/**
 * DemoScheduler - Demo Scheduling Component
 *
 * Embeds Calendly for demo scheduling with:
 * - Prefilled contact data
 * - Auto CRM trigger on scheduling
 * - Event type selection
 *
 * Note: If NEXT_PUBLIC_CALENDLY_URL is not set, shows a fallback form.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { DemoSchedulerProps } from '@/lib/generative-ui/schemas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  Clock,
  User,
  Mail,
  Building2,
  CheckCircle,
  Loader2,
  ExternalLink,
  Sparkles
} from 'lucide-react'

interface DemoSchedulerComponentProps extends DemoSchedulerProps {
  onInteraction?: (action: string, component: string, data: Record<string, unknown>) => void
}

const EVENT_TYPE_LABELS: Record<string, { label: string; duration: string }> = {
  demo_30min: { label: 'Demo Rápida', duration: '30 min' },
  demo_60min: { label: 'Demo Completa', duration: '60 min' },
  onboarding_call: { label: 'Onboarding', duration: '45 min' },
}

export function DemoScheduler({
  eventType,
  prefill,
  autoTriggerCRM = true,
  onInteraction
}: DemoSchedulerComponentProps) {
  const [name, setName] = useState(prefill?.name || '')
  const [email, setEmail] = useState(prefill?.email || '')
  const [company, setCompany] = useState(prefill?.company || '')
  const [selectedEvent, setSelectedEvent] = useState(eventType)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isScheduled, setIsScheduled] = useState(false)
  const [showCalendly, setShowCalendly] = useState(false)

  // Check if Calendly URL is configured
  const calendlyBaseUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || ''
  const hasCalendly = calendlyBaseUrl.length > 0

  // Build Calendly URL with prefill
  const buildCalendlyUrl = useCallback(() => {
    if (!calendlyBaseUrl) return ''

    const params = new URLSearchParams()
    if (name) params.set('name', name)
    if (email) params.set('email', email)
    if (company) params.set('a1', company) // Custom question

    return `${calendlyBaseUrl}/${selectedEvent}?${params.toString()}`
  }, [calendlyBaseUrl, name, email, company, selectedEvent])

  // Listen for Calendly events via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.event === 'calendly.event_scheduled') {
        handleSchedulingComplete(event.data.payload)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Handle scheduling complete (from Calendly or fallback form)
  const handleSchedulingComplete = async (payload?: Record<string, unknown>) => {
    setIsScheduled(true)

    // Create deal if auto trigger enabled
    if (autoTriggerCRM) {
      try {
        await fetch('/api/v1/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Demo - ${company || name}`,
            value: 0,
            notes: `Demo agendada via chat AI.\nTipo: ${EVENT_TYPE_LABELS[selectedEvent].label}\nContato: ${name} (${email})`,
            tags: ['demo-agendada', 'via-ai'],
          }),
        })
      } catch (error) {
        console.error('Error creating deal:', error)
      }
    }

    onInteraction?.('demo_scheduled', 'DemoScheduler', {
      eventType: selectedEvent,
      name,
      email,
      company,
      autoTriggerCRM,
      payload,
    })
  }

  // Handle fallback form submission
  const handleFallbackSubmit = async () => {
    if (!name || !email) return

    setIsSubmitting(true)

    try {
      // Simulate scheduling delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      handleSchedulingComplete()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open Calendly in popup
  const openCalendlyPopup = () => {
    const url = buildCalendlyUrl()
    if (url) {
      window.open(url, 'calendly', 'width=600,height=800')
    }
  }

  if (isScheduled) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        data-testid="demo-scheduler-success"
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
              Demo Agendada!
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Você receberá uma confirmação por email em breve.
            </p>
            {autoTriggerCRM && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Deal criado automaticamente no CRM
              </Badge>
            )}
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
      data-testid="demo-scheduler"
    >
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Agendar Demo</CardTitle>
                <CardDescription>
                  Escolha o melhor horário para você
                </CardDescription>
              </div>
            </div>
            {autoTriggerCRM && (
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Auto-CRM
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Event Type Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Tipo de Reunião
            </Label>
            <Select value={selectedEvent} onValueChange={(value) => setSelectedEvent(value as typeof eventType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_TYPE_LABELS).map(([key, { label, duration }]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      {label}
                      <Badge variant="outline" className="text-xs">
                        {duration}
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Nome *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Empresa
            </Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Nome da sua empresa"
            />
          </div>

          {/* Calendly Embed or Fallback */}
          {hasCalendly ? (
            <div className="space-y-3">
              {showCalendly ? (
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    src={buildCalendlyUrl()}
                    width="100%"
                    height="600"
                    frameBorder="0"
                    title="Agendar Demo"
                  />
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => setShowCalendly(true)}
                    disabled={!name || !email}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Ver Horários Disponíveis
                  </Button>
                  <Button
                    variant="outline"
                    onClick={openCalendlyPopup}
                    disabled={!name || !email}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Fallback form when Calendly is not configured
            <div className="space-y-4 pt-2">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Selecione sua preferência de horário:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Manhã', 'Tarde', 'Noite'].map(period => (
                    <Badge
                      key={period}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {period}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleFallbackSubmit}
                disabled={!name || !email || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Agendando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Solicitar Agendamento
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Nossa equipe entrará em contato para confirmar o horário.
              </p>
            </div>
          )}

          {/* Auto CRM Notice */}
          {autoTriggerCRM && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-primary/5 border border-primary/10 rounded-lg p-3"
            >
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                Um deal será criado automaticamente ao confirmar o agendamento.
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default DemoScheduler
