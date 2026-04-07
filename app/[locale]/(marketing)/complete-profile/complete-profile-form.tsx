'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowRight, ArrowLeft, Phone, Building2, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const SEGMENTS = [
  'Agronegócio',
  'Agências de Marketing e Publicidade',
  'Consultorias e Treinamentos',
  'e-Commerce',
  'Educação e Ensino',
  'Engenharia e Indústria Geral',
  'Eventos',
  'Governo e Órgãos Públicos',
  'Hardware e Eletrônicos',
  'Imobiliárias',
  'Jurídico e Serviços Relacionados',
  'Mídia e Comunicação',
  'ONGs',
  'Saúde e Estética',
  'Serviços em Geral',
  'Serviços em RH e Coaching',
  'Software e Cloud',
  'Telecomunicações',
  'Turismo e Lazer',
  'Varejo',
  'Outro',
]

const JOB_TITLES = [
  'Sócio / Fundador / Proprietário',
  'CEO / Diretor Geral',
  'Diretor de Vendas / Comercial',
  'Gerente de Vendas',
  'Coordenador Comercial',
  'Vendedor / Consultor de Vendas',
  'Gerente de Marketing',
  'Analista / Assistente',
  'Outro',
]

interface CompleteProfileFormProps {
  userId: string
  userName: string
  organizationId: string
  currentOrgName: string
}

export function CompleteProfileForm({ userId, userName, organizationId, currentOrgName }: CompleteProfileFormProps) {
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [phone, setPhone] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState(currentOrgName === userName ? '' : currentOrgName)
  const [companyDescription, setCompanyDescription] = useState('')
  const [segment, setSegment] = useState('')

  const totalSteps = 2

  function canAdvance() {
    if (step === 1) return phone && jobTitle
    if (step === 2) return company && segment
    return false
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (step < totalSteps) {
      setStep(step + 1)
      setError(null)
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/complete-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone,
            jobTitle,
            company,
            companyDescription,
            segment,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Erro ao salvar. Tente novamente.')
          return
        }

        router.push('/dashboard?new_user=true')
      } catch {
        setError('Erro de conexão. Tente novamente.')
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium mb-4">
            Falta pouco!
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 1 ? 'Conte-nos sobre você' : 'Sobre sua empresa'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1
              ? 'Precisamos de alguns dados para personalizar sua experiência.'
              : 'Essas informações nos ajudam a configurar o CRM ideal para você.'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div className={cn(
                'flex items-center justify-center h-9 w-9 rounded-full text-sm font-semibold transition-all',
                s < step && 'bg-indigo-600 text-white',
                s === step && 'bg-indigo-600 text-white ring-2 ring-indigo-200',
                s > step && 'bg-gray-100 text-gray-400'
              )}>
                {s < step ? (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : s === 1 ? (
                  <Phone className="h-4 w-4" />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
              </div>
              {s < 2 && (
                <div className={cn(
                  'h-0.5 w-12 rounded-full transition-all',
                  s < step ? 'bg-indigo-600' : 'bg-gray-200'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          {/* STEP 1: About you */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700">Telefone Principal</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+55 (11) 99999-9999"
                  required
                  autoFocus
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400">Seu número principal para contato.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="text-gray-700">Qual é seu cargo?</Label>
                <div className="relative">
                  <select
                    id="jobTitle"
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    required
                    className="w-full h-10 rounded-md bg-white border border-gray-300 text-gray-900 px-3 pr-8 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="" disabled>Selecionar</option>
                    {JOB_TITLES.map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </>
          )}

          {/* STEP 2: Company */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-gray-700">Nome da Empresa</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Minha Empresa Ltda"
                  required
                  autoFocus
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyDescription" className="text-gray-700">O que sua empresa faz?</Label>
                <Textarea
                  id="companyDescription"
                  value={companyDescription}
                  onChange={e => setCompanyDescription(e.target.value)}
                  placeholder="Ex: Vendemos consórcios para pessoa física e jurídica..."
                  rows={3}
                  className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 resize-none focus:border-indigo-500 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400">Opcional. Nos ajuda a personalizar sua experiência.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="segment" className="text-gray-700">Segmento da empresa</Label>
                <div className="relative">
                  <select
                    id="segment"
                    value={segment}
                    onChange={e => setSegment(e.target.value)}
                    required
                    className="w-full h-10 rounded-md bg-white border border-gray-300 text-gray-900 px-3 pr-8 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="" disabled>Selecionar</option>
                    {SEGMENTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => { setStep(step - 1); setError(null) }}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            )}

            {step < totalSteps ? (
              <Button
                type="submit"
                disabled={!canAdvance()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Avançar
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isPending || !canAdvance()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Começar a usar o Sirius'
                )}
              </Button>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-1">
            <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            SSL Seguro
          </div>
          <span>-</span>
          <div className="flex items-center gap-1">
            <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            LGPD
          </div>
        </div>
      </div>
    </div>
  )
}
