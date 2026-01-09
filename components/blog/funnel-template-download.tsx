'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, CheckCircle2, FileText } from 'lucide-react'
import { toast } from 'sonner'

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

      // Gera o conteúdo do template
      const templateContent = generateTemplateContent()

      // Cria o arquivo para download
      const blob = new Blob([templateContent], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'template-funil-vendas-sirius.txt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setDownloadComplete(true)
      toast.success('Template enviado para seu email!')

    } catch (error) {
      toast.error('Erro ao fazer download. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const generateTemplateContent = () => {
    return `
═══════════════════════════════════════════════════════════════════
   TEMPLATE: CHECKLIST DE IMPLEMENTAÇÃO DE FUNIL DE VENDAS
   Sirius CRM - https://sirius.roilabs.com.br
═══════════════════════════════════════════════════════════════════

Nome: ${name}
Email: ${email}
Data: ${new Date().toLocaleDateString('pt-BR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 FASE 1: PLANEJAMENTO ESTRATÉGICO (Semana 1)

□ Mapear jornada do cliente atual
  ├─ Identificar pontos de contato
  ├─ Documentar objeções comuns
  └─ Estimar tempo médio por etapa

□ Definir etapas do funil (sugestão: 5-7 etapas)
  Exemplo:
  1. Atração (Visitantes)
  2. Interesse (Leads)
  3. Consideração (Qualificados)
  4. Intenção (Proposta)
  5. Compra (Fechamento)

□ Estabelecer critérios claros de passagem entre etapas
  Para cada etapa, defina:
  ├─ O que precisa acontecer para ENTRAR
  ├─ O que precisa acontecer para AVANÇAR
  └─ Quando marcar como PERDIDO

□ Definir metas de conversão por etapa
  Benchmarks sugeridos:
  ├─ Atração → Interesse: 10-15%
  ├─ Interesse → Consideração: 40-50%
  ├─ Consideração → Intenção: 50-60%
  └─ Intenção → Compra: 25-35%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛠️ FASE 2: IMPLEMENTAÇÃO TÉCNICA (Semana 2)

□ Escolher e configurar CRM
  Opções:
  ├─ Sirius CRM (recomendado) - sirius.roilabs.com.br
  ├─ HubSpot
  └─ Pipedrive

□ Criar as etapas no CRM
  ├─ Adicionar etapas personalizadas
  ├─ Configurar cores/ícones
  └─ Testar drag & drop

□ Configurar campos personalizados
  Campos essenciais:
  ├─ Origem do lead
  ├─ Data de primeiro contato
  ├─ Próxima ação agendada
  ├─ Motivo de perda (se aplicável)
  └─ Probabilidade de fechamento (%)

□ Integrar ferramentas externas
  ├─ Email marketing
  ├─ WhatsApp Business
  ├─ Calendário (Google/Outlook)
  └─ Landing pages

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 FASE 3: AUTOMAÇÕES (Semana 3)

□ Configurar automação de captura de leads
  ├─ Formulário do site → CRM
  ├─ Landing page → CRM
  └─ Chat/WhatsApp → CRM

□ Criar sequências de follow-up automático
  Sequência sugerida:
  ├─ Dia 0: Email de boas-vindas
  ├─ Dia 2: Email com conteúdo educativo
  ├─ Dia 5: Ligação do vendedor
  ├─ Dia 7: Email com prova social (cases)
  └─ Dia 10: Oferta personalizada

□ Configurar notificações da equipe
  ├─ Novo lead entrou no funil
  ├─ Lead sem atividade há 5 dias
  ├─ Lead mudou de etapa
  └─ Deal próximo de fechar

□ Automatizar tarefas recorrentes
  ├─ Envio de propostas
  ├─ Agendamento de demos
  └─ Follow-up pós-reunião

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 FASE 4: TREINAMENTO DA EQUIPE (Semana 3-4)

□ Realizar workshop de CRM
  Conteúdo:
  ├─ Login e navegação
  ├─ Como adicionar um lead
  ├─ Como mover entre etapas
  ├─ Como registrar atividades
  └─ Como gerar relatórios

□ Criar playbook de vendas
  Incluir:
  ├─ Scripts por etapa
  ├─ Perguntas de qualificação (BANT)
  ├─ Respostas para objeções comuns
  └─ Quando envolver o gerente

□ Definir SLA (acordo de nível de serviço)
  Exemplos:
  ├─ Primeiro contato: máx 5 minutos
  ├─ Resposta a lead: máx 1 hora
  ├─ Follow-up após reunião: máx 24 horas
  └─ Atualização do CRM: diariamente

□ Estabelecer ritual de review semanal
  Agenda:
  ├─ Segunda, 9h: Review de pipeline
  ├─ Analisar conversão por etapa
  ├─ Identificar deals travados
  └─ Celebrar vitórias

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 FASE 5: MONITORAMENTO E OTIMIZAÇÃO (Contínuo)

□ Acompanhar métricas semanais
  KPIs obrigatórios:
  ├─ Taxa de conversão geral
  ├─ Taxa de conversão por etapa
  ├─ Tempo médio no funil
  ├─ Velocidade do funil
  ├─ Ticket médio
  └─ Taxa de churn

□ Identificar gargalos
  Perguntas:
  ├─ Qual etapa tem maior "fuga"?
  ├─ Onde os deals ficam travados?
  ├─ Qual vendedor tem melhor conversão?
  └─ Quais fontes de lead convertem mais?

□ Realizar testes A/B
  Testar:
  ├─ Diferentes abordagens de email
  ├─ Horários de contato
  ├─ Scripts de qualificação
  └─ Argumentos de venda

□ Limpar o pipeline regularmente
  Frequência: Semanalmente
  ├─ Remover leads inativos (>30 dias)
  ├─ Reclassificar leads mal qualificados
  └─ Arquivar deals perdidos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 CHECKLIST DE MANUTENÇÃO DIÁRIA

□ MANHÃ (15 min)
  ├─ Revisar novos leads do dia anterior
  ├─ Checar tarefas agendadas para hoje
  └─ Atualizar deals que avançaram

□ TARDE (10 min)
  ├─ Registrar todas as atividades do dia
  ├─ Agendar follow-ups necessários
  └─ Mover deals para próxima etapa

□ FIM DO DIA (5 min)
  ├─ Verificar leads sem resposta
  └─ Preparar agenda do dia seguinte

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ 7 ERROS FATAIS A EVITAR

1. ❌ Funil muito complexo (>7 etapas)
   ✅ Mantenha simples: 5 etapas são suficientes

2. ❌ Não atualizar o CRM diariamente
   ✅ Torne obrigatório: sem CRM atualizado, sem comissão

3. ❌ Ignorar leads "frios"
   ✅ Configure automação de nutrição

4. ❌ Pular etapas do funil
   ✅ Respeite a jornada do comprador

5. ❌ Não acompanhar métricas
   ✅ Dashboard semanal obrigatório

6. ❌ Funil desalinhado com marketing
   ✅ Crie SLA entre times

7. ❌ Critérios subjetivos de passagem
   ✅ Defina regras claras e objetivas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 RECURSOS ADICIONAIS

🔗 Artigos Recomendados:
   • Como Organizar Seu Pipeline: sirius.roilabs.com.br/blog/como-organizar-pipeline-vendas
   • O Poder do Follow-up: sirius.roilabs.com.br/blog/poder-do-follow-up
   • CRM Simples vs Complexo: sirius.roilabs.com.br/blog/crm-simples-vs-complexo

🎓 Teste Grátis do Sirius CRM:
   https://sirius.roilabs.com.br/register

   Recursos inclusos:
   ├─ Funil visual drag & drop
   ├─ Automação de follow-up
   ├─ Integração WhatsApp
   ├─ Dashboard de métricas
   └─ Suporte via chat

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 NOTAS PESSOAIS

Anotações e insights:

_____________________________________________________________________

_____________________________________________________________________

_____________________________________________________________________

_____________________________________________________________________

_____________________________________________________________________

_____________________________________________________________________


═══════════════════════════════════════════════════════════════════
© 2026 Sirius CRM | Transformando leads em clientes desde 2025
═══════════════════════════════════════════════════════════════════
    `.trim()
  }

  if (downloadComplete) {
    return (
      <Card className="my-8 border-2 border-green-500/30 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-2">
            Template Enviado com Sucesso!
          </h3>
          <p className="text-green-600 dark:text-green-500 mb-4">
            O download começou automaticamente. Verifique também seu email em {email}
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
