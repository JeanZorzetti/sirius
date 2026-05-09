'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Building2, User, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface LeadCaptureModalProps {
  open: boolean
  onClose: () => void
  volumeLeads: number
  ticketMedio: number
  perdaMensal: number
  origem: string
  onSuccess?: () => void
}

export function LeadCaptureModal({
  open,
  onClose,
  volumeLeads,
  ticketMedio,
  perdaMensal,
  origem,
  onSuccess
}: LeadCaptureModalProps) {
  const tCommon = useTranslations('common')
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Por favor, informe seu email')
      return
    }

    setIsLoading(true)

    try {
      // Enviar dados para API de captura de leads
      const response = await fetch('/api/leads/capture-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          nome,
          empresa,
          volumeLeads,
          ticketMedio,
          perdaMensal,
          origem
        })
      })

      if (!response.ok) throw new Error('Erro ao capturar lead')

      setIsSuccess(true)

      toast.success('Resultado enviado para seu email!', {
        description: 'Confira sua caixa de entrada'
      })

      // Redirecionar para página de vendas após 2 segundos
      setTimeout(() => {
        window.location.href = `/vendas-automaticas?origem=${origem}&email=${email}`
      }, 2000)

      onSuccess?.()
    } catch (error) {
      console.error('Error capturing lead:', error)
      toast.error('Erro ao enviar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Enviado com sucesso!</h3>
            <p className="text-muted-foreground mb-4">
              Acabamos de enviar o resultado detalhado para <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecionando para próxima etapa...
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">
                📊 Receba o Resultado Completo
              </DialogTitle>
              <DialogDescription className="text-base pt-2">
                Você está perdendo <span className="font-bold text-red-600">R$ {perdaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span> por mês.
                Vamos enviar uma análise detalhada para seu email.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome (opcional)
                </Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="empresa" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Empresa (opcional)
                </Label>
                <Input
                  id="empresa"
                  type="text"
                  placeholder="Nome da sua empresa"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">
                  ✨ <strong>Bônus:</strong> Você também vai receber um guia prático de como recuperar essas vendas perdidas.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {tCommon('buttons.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tCommon('buttons.submitting')}
                    </>
                  ) : (
                    <>
                      Receber Resultado
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Seus dados estão seguros. Não compartilhamos com terceiros.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
