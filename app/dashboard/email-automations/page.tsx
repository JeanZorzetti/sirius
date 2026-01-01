import { Suspense } from 'react'
import { getEmailAutomationSettings, getEmailHistory } from './actions'
import { EmailAutomationsClient } from './client'
import { Skeleton } from '@/components/ui/skeleton'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Automações de Email | Sirius CRM',
  description: 'Gerencie as automações de email do seu CRM'
}

export default async function EmailAutomationsPage() {
  const [settings, historyResult] = await Promise.all([
    getEmailAutomationSettings(),
    getEmailHistory(50)
  ])

  // Default subjects and bodies for each automation type
  const defaultTemplates = {
    WELCOME_EMAIL: {
      subject: 'Bem-vindo ao Sirius CRM, {{userName}}!',
      body: `Olá {{userName}},

Bem-vindo ao Sirius CRM! Estamos muito felizes em ter você e a {{organizationName}} conosco.

Agora você tem acesso a um CRM completo para gerenciar seus negócios, contatos e pipelines de vendas.

Próximos passos:
1. Crie seu primeiro negócio
2. Configure suas etapas de vendas
3. Convide sua equipe

Acesse seu dashboard: {{dashboardUrl}}

Qualquer dúvida, estamos aqui para ajudar!

Equipe Sirius CRM`
    },
    DEAL_CREATED: {
      subject: 'Novo negócio criado: {{dealTitle}}',
      body: `Olá {{userName}},

Um novo negócio foi criado no CRM:

📋 **Negócio:** {{dealTitle}}
💰 **Valor:** {{dealValue}}
📊 **Etapa:** {{dealStage}}
👤 **Contato:** {{contactName}}

Acesse o negócio: {{dealUrl}}

Boa venda!

Equipe Sirius CRM`
    },
    DEAL_STAGE_CHANGED: {
      subject: '{{dealTitle}} mudou para {{newStage}}',
      body: `Olá {{assigneeName}},

O negócio **{{dealTitle}}** mudou de etapa:

📊 **De:** {{oldStage}}
📊 **Para:** {{newStage}}
💰 **Valor:** {{dealValue}}

Continue acompanhando: {{dealUrl}}

Sucesso!

Equipe Sirius CRM`
    },
    UPGRADE_NUDGE: {
      subject: 'Você está perto do limite de negócios! 📊',
      body: `Olá {{userName}},

Você está utilizando {{currentDeals}} de {{maxDeals}} negócios do seu plano FREE.

Está na hora de fazer upgrade para o plano PRO e desbloquear:
✨ Negócios ilimitados
✨ Múltiplos pipelines
✨ Analytics avançado
✨ Automações personalizadas

Faça upgrade agora: {{upgradeUrl}}

Continue crescendo com a gente!

Equipe Sirius CRM`
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <EmailAutomationsClient
          settings={settings}
          emailHistory={historyResult.logs || []}
          analytics={historyResult.analytics}
          isPro={historyResult.isPro || false}
          defaultTemplates={defaultTemplates}
        />
      </Suspense>
    </div>
  )
}
