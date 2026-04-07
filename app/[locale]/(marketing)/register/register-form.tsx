'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { registerAction } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Eye, EyeOff, ArrowRight, ArrowLeft, User, Building2, Lock, Phone, ChevronDown } from 'lucide-react'
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

export function RegisterForm({ inviteData, inviteToken }: { inviteData: any, inviteToken?: string }) {
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState(inviteData?.email || '')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [companyDescription, setCompanyDescription] = useState('')
  const [segment, setSegment] = useState('')

  const totalSteps = inviteData ? 1 : 3

  function canAdvance() {
    if (step === 1) return name && email && password
    if (step === 2) return phone && jobTitle
    if (step === 3) return company && segment
    return false
  }

  function handleNext() {
    if (step < totalSteps) {
      setStep(step + 1)
      setError(null)
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep(step - 1)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (step < totalSteps) {
      handleNext()
      return
    }

    const formData = new FormData()
    formData.set('name', name)
    formData.set('email', email)
    formData.set('password', password)
    formData.set('phone', phone)
    formData.set('jobTitle', jobTitle)
    formData.set('company', company)
    formData.set('companyDescription', companyDescription)
    formData.set('segment', segment)
    if (inviteToken) formData.set('inviteToken', inviteToken)

    startTransition(async () => {
      const result = await registerAction(null, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/dashboard?new_user=true')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-5">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
            {error}
          </div>
        )}

        {/* Step indicator */}
        {totalSteps > 1 && (
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-full text-xs font-semibold transition-all",
                  s < step && "bg-indigo-600 text-white",
                  s === step && "bg-indigo-600 text-white ring-2 ring-indigo-400/50 ring-offset-2 ring-offset-zinc-900",
                  s > step && "bg-zinc-800 text-zinc-500"
                )}>
                  {s < step ? (
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : s === 1 ? (
                    <User className="h-3.5 w-3.5" />
                  ) : s === 2 ? (
                    <Phone className="h-3.5 w-3.5" />
                  ) : (
                    <Building2 className="h-3.5 w-3.5" />
                  )}
                </div>
                {s < 3 && (
                  <div className={cn(
                    "h-0.5 w-8 rounded-full transition-all",
                    s < step ? "bg-indigo-600" : "bg-zinc-800"
                  )} />
                )}
              </div>
            ))}
            <span className="ml-auto text-xs text-zinc-500">
              {step === 1 ? 'Sua conta' : step === 2 ? 'Sobre você' : 'Sua empresa'}
            </span>
          </div>
        )}

        {/* STEP 1: Account */}
        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Seu Nome Completo</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="João da Silva"
                required
                autoFocus
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="joao@empresa.com"
                required
                readOnly={!!inviteData}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {inviteData && (
              <input type="hidden" name="inviteToken" value={inviteToken} />
            )}
          </>
        )}

        {/* STEP 2: About you */}
        {step === 2 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone Principal</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+55 (11) 99999-9999"
                required
                autoFocus
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <p className="text-xs text-zinc-500">Seu número principal para contato.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">Qual é seu cargo?</Label>
              <div className="relative">
                <select
                  id="jobTitle"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  required
                  className="w-full h-10 rounded-md bg-zinc-800 border border-zinc-700 text-white px-3 pr-8 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="" disabled>Selecionar</option>
                  {JOB_TITLES.map(j => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              </div>
            </div>
          </>
        )}

        {/* STEP 3: Company */}
        {step === 3 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="company">Nome da Empresa</Label>
              <Input
                id="company"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Minha Empresa Ltda"
                required
                autoFocus
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyDescription">O que sua empresa faz?</Label>
              <Textarea
                id="companyDescription"
                value={companyDescription}
                onChange={e => setCompanyDescription(e.target.value)}
                placeholder="Ex: Vendemos consórcios para pessoa física e jurídica..."
                rows={3}
                className="bg-zinc-800 border-zinc-700 text-white resize-none"
              />
              <p className="text-xs text-zinc-500">Opcional. Nos ajuda a personalizar sua experiência.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="segment">Segmento da empresa</Label>
              <div className="relative">
                <select
                  id="segment"
                  value={segment}
                  onChange={e => setSegment(e.target.value)}
                  required
                  className="w-full h-10 rounded-md bg-zinc-800 border border-zinc-700 text-white px-3 pr-8 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="" disabled>Selecionar</option>
                  {SEGMENTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              </div>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        <div className="flex w-full gap-3">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
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
              {isPending ? 'Criando conta...' : (inviteData ? 'Entrar na Equipe' : 'Criar Conta Grátis')}
            </Button>
          )}
        </div>

        {step === 1 && !inviteData && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-2 text-zinc-500">Ou continue com</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </Button>
          </>
        )}

        <div className="flex items-center justify-center gap-4 text-xs text-zinc-500 border-t border-zinc-800 pt-4">
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
          <span>-</span>
          <div className="flex items-center gap-1">
            <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Sem Spam
          </div>
        </div>

        <div className="text-center text-sm text-zinc-400">
          Já tem uma conta? <Link href="/login" className="text-indigo-400 hover:text-indigo-300">Entrar</Link>
        </div>
      </CardFooter>
    </form>
  )
}
