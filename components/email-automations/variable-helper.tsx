'use client'

import { EmailAutomationType } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Code } from 'lucide-react'

interface VariableHelperProps {
  type: EmailAutomationType
}

const variables = {
  WELCOME_EMAIL: [
    { name: '{{userName}}', description: 'Nome do usuário' },
    { name: '{{userEmail}}', description: 'Email do usuário' },
    { name: '{{organizationName}}', description: 'Nome da organização' },
    { name: '{{dashboardUrl}}', description: 'Link para o dashboard' }
  ],
  DEAL_CREATED: [
    { name: '{{userName}}', description: 'Nome do destinatário' },
    { name: '{{dealTitle}}', description: 'Título do deal' },
    { name: '{{dealValue}}', description: 'Valor do deal (formatado)' },
    { name: '{{dealStage}}', description: 'Etapa atual do deal' },
    { name: '{{contactName}}', description: 'Nome do contato' },
    { name: '{{dealUrl}}', description: 'Link direto para o deal' }
  ],
  DEAL_STAGE_CHANGED: [
    { name: '{{assigneeName}}', description: 'Nome do responsável' },
    { name: '{{dealTitle}}', description: 'Título do deal' },
    { name: '{{dealValue}}', description: 'Valor do deal (formatado)' },
    { name: '{{oldStage}}', description: 'Etapa anterior' },
    { name: '{{newStage}}', description: 'Nova etapa' },
    { name: '{{dealUrl}}', description: 'Link direto para o deal' }
  ],
  UPGRADE_NUDGE: [
    { name: '{{userName}}', description: 'Nome do usuário' },
    { name: '{{currentDeals}}', description: 'Quantidade atual de deals' },
    { name: '{{maxDeals}}', description: 'Limite de deals' },
    { name: '{{upgradeUrl}}', description: 'Link para página de upgrade' }
  ]
}

export function VariableHelper({ type }: VariableHelperProps) {
  const availableVariables = variables[type] || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Code className="h-4 w-4" />
          Variáveis Disponíveis
        </CardTitle>
        <CardDescription className="text-xs">
          Use estas variáveis no assunto e corpo do email. Elas serão substituídas automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {availableVariables.map((variable) => (
            <div
              key={variable.name}
              className="flex items-start justify-between gap-4 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(variable.name)
              }}
              title="Clique para copiar"
            >
              <div className="flex-1 min-w-0">
                <code className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {variable.name}
                </code>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {variable.description}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">
            <strong>Dica:</strong> Clique em uma variável para copiar. Cole no editor usando Ctrl+V.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
