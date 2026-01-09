'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, CheckCircle2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import jsPDF from 'jspdf'

export function FunnelTemplateDownload() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [downloadComplete, setDownloadComplete] = useState(false)

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !name) {
      toast.error('Por favor, preencha todos os campos')
      return
    }

    setIsLoading(true)

    try {
      // Simula envio de email (implementar backend real depois)
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Gera o PDF
      generatePDF()

      setDownloadComplete(true)
      toast.success('Template baixado com sucesso!')

    } catch (error) {
      toast.error('Erro ao fazer download. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const generatePDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    let yPos = 20

    // Função auxiliar para adicionar texto centralizado
    const addCenteredText = (text: string, y: number, fontSize: number = 12, isBold = false) => {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', isBold ? 'bold' : 'normal')
      const textWidth = doc.getTextWidth(text)
      doc.text(text, (pageWidth - textWidth) / 2, y)
    }

    // Função auxiliar para adicionar checkbox
    const addCheckbox = (text: string, y: number, indent = 0) => {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.rect(10 + indent, y - 3, 3, 3) // checkbox
      doc.text(text, 15 + indent, y)
    }

    // Cabeçalho
    doc.setFillColor(37, 99, 235) // Azul Sirius
    doc.rect(0, 0, pageWidth, 35, 'F')

    doc.setTextColor(255, 255, 255)
    addCenteredText('TEMPLATE: CHECKLIST DE IMPLEMENTAÇÃO', 15, 16, true)
    addCenteredText('DE FUNIL DE VENDAS', 23, 16, true)
    doc.setFontSize(10)
    addCenteredText('Sirius CRM - https://sirius.roilabs.com.br', 30, 10)

    // Informações do usuário
    doc.setTextColor(0, 0, 0)
    yPos = 45
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nome: ${name}`, 10, yPos)
    yPos += 6
    doc.text(`Email: ${email}`, 10, yPos)
    yPos += 6
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 10, yPos)
    yPos += 12

    // Linha divisória
    doc.setDrawColor(226, 232, 240)
    doc.line(10, yPos, pageWidth - 10, yPos)
    yPos += 10

    // FASE 1
    doc.setFillColor(239, 246, 255)
    doc.rect(10, yPos - 5, pageWidth - 20, 8, 'F')
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 64, 175)
    doc.text('📋 FASE 1: PLANEJAMENTO ESTRATÉGICO (Semana 1)', 12, yPos)
    yPos += 10

    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    addCheckbox('Mapear jornada do cliente atual', yPos)
    yPos += 6
    addCheckbox('Definir etapas do funil (5-7 etapas)', yPos)
    yPos += 6
    addCheckbox('Estabelecer critérios de passagem entre etapas', yPos)
    yPos += 6
    addCheckbox('Definir metas de conversão por etapa', yPos)
    yPos += 6
    addCheckbox('Escolher e configurar CRM', yPos)
    yPos += 12

    // FASE 2
    doc.setFillColor(239, 246, 255)
    doc.rect(10, yPos - 5, pageWidth - 20, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 64, 175)
    doc.text('⚙️ FASE 2: IMPLEMENTAÇÃO TÉCNICA (Semana 2)', 12, yPos)
    yPos += 10

    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    addCheckbox('Criar campos customizados no CRM', yPos)
    yPos += 6
    addCheckbox('Configurar automações de etapa', yPos)
    yPos += 6
    addCheckbox('Integrar canais de comunicação (WhatsApp, Email)', yPos)
    yPos += 6
    addCheckbox('Configurar alertas de inatividade', yPos)
    yPos += 6
    addCheckbox('Criar templates de mensagens', yPos)
    yPos += 12

    // FASE 3
    doc.setFillColor(239, 246, 255)
    doc.rect(10, yPos - 5, pageWidth - 20, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 64, 175)
    doc.text('👥 FASE 3: TREINAMENTO DA EQUIPE (Semana 3)', 12, yPos)
    yPos += 10

    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    addCheckbox('Treinar equipe no uso do CRM', yPos)
    yPos += 6
    addCheckbox('Criar manual de operação do funil', yPos)
    yPos += 6
    addCheckbox('Definir playbooks por etapa', yPos)
    yPos += 6
    addCheckbox('Estabelecer rituais de revisão', yPos)
    yPos += 12

    // Nova página para FASE 4 e 5
    doc.addPage()
    yPos = 20

    // FASE 4
    doc.setFillColor(239, 246, 255)
    doc.rect(10, yPos - 5, pageWidth - 20, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 64, 175)
    doc.text('🚀 FASE 4: LANÇAMENTO E TESTE (Semana 4)', 12, yPos)
    yPos += 10

    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    addCheckbox('Migrar leads existentes para o funil', yPos)
    yPos += 6
    addCheckbox('Testar fluxo completo com leads piloto', yPos)
    yPos += 6
    addCheckbox('Ajustar critérios com base nos testes', yPos)
    yPos += 6
    addCheckbox('Configurar dashboard de métricas', yPos)
    yPos += 6
    addCheckbox('Validar automações e alertas', yPos)
    yPos += 12

    // FASE 5
    doc.setFillColor(239, 246, 255)
    doc.rect(10, yPos - 5, pageWidth - 20, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 64, 175)
    doc.text('📊 FASE 5: OTIMIZAÇÃO CONTÍNUA (Mensal)', 12, yPos)
    yPos += 10

    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    addCheckbox('Revisar taxas de conversão por etapa', yPos)
    yPos += 6
    addCheckbox('Identificar e corrigir gargalos', yPos)
    yPos += 6
    addCheckbox('Testar variações de abordagem', yPos)
    yPos += 6
    addCheckbox('Atualizar benchmarks internos', yPos)
    yPos += 6
    addCheckbox('Treinar time com base em dados', yPos)
    yPos += 15

    // Rodapé
    doc.setDrawColor(226, 232, 240)
    doc.line(10, yPos, pageWidth - 10, yPos)
    yPos += 8
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    addCenteredText('💡 Dica: Revise este checklist semanalmente nas primeiras 4 semanas', yPos, 9)
    yPos += 5
    addCenteredText('e mensalmente depois. Cada negócio é único - adapte conforme necessário!', yPos, 9)
    yPos += 10
    addCenteredText('🚀 Comece gratuitamente: https://sirius.roilabs.com.br/register', yPos, 9)

    // Salvar PDF
    doc.save('checklist-funil-vendas-sirius.pdf')
  }

  if (downloadComplete) {
    return (
      <Card className="my-8 border-2 border-green-500/30 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
            Template Baixado com Sucesso!
          </h3>
          <p className="text-green-600 dark:text-green-500 mb-4">
            O PDF foi baixado automaticamente. Verifique sua pasta de downloads!
          </p>
          <Button
            variant="outline"
            onClick={() => setDownloadComplete(false)}
            className="border-green-500 text-green-700 hover:bg-green-100"
          >
            Baixar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="my-8 border-2 border-primary shadow-2xl bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-primary/10 dark:via-zinc-900 dark:to-primary/5">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary rounded-xl shadow-lg">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-2xl mb-2">
              🎁 Template GRATUITO: Checklist Completo de Funil
            </CardTitle>
            <CardDescription className="text-base">
              Baixe nosso template passo a passo para implementar um funil de vendas do zero em 30 dias
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border-2 border-dashed border-primary/30 mb-6">
          <h4 className="font-bold text-lg mb-3">📦 O que você vai receber:</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>✅ Checklist com 5 fases de implementação</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>🎯 Critérios de passagem entre etapas</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>📊 Benchmarks de conversão por etapa</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>🤖 Ideias de automações para economizar tempo</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>❌ 7 erros fatais a evitar</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>📋 Checklist de manutenção diária</span>
            </li>
          </ul>
        </div>

        <form onSubmit={handleDownload} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="download-name">Nome completo *</Label>
              <Input
                id="download-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="João Silva"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="download-email">Email profissional *</Label>
              <Input
                id="download-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@empresa.com.br"
                required
                className="h-11"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Preparando seu template...
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Baixar Template Grátis
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            🔒 Seus dados estão seguros. Não fazemos spam.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
