'use client'

import { UserPlus, CreditCard, HelpCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  onClick?: () => void
  variant?: 'default' | 'outline' | 'ghost'
}

const actions: QuickAction[] = [
  {
    id: 'invite',
    label: 'Convidar Membro',
    icon: UserPlus,
    href: '/dashboard/settings/team',
    variant: 'default',
  },
  {
    id: 'billing',
    label: 'Ver Fatura',
    icon: CreditCard,
    href: '/dashboard/billing',
    variant: 'outline',
  },
  {
    id: 'export',
    label: 'Exportar Dados',
    icon: Download,
    variant: 'outline',
  },
  {
    id: 'support',
    label: 'Suporte',
    icon: HelpCircle,
    href: '/help',
    variant: 'ghost',
  },
]

interface QuickActionsProps {
  onExportData?: () => void
}

export function QuickActions({ onExportData }: QuickActionsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {actions.map((action) => {
        const Icon = action.icon

        if (action.id === 'export' && onExportData) {
          return (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={onExportData}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </Button>
          )
        }

        if (action.href) {
          if (action.href.startsWith('/help')) {
            return (
              <a
                key={action.id}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant={action.variant || 'outline'}
                  size="sm"
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {action.label}
                </Button>
              </a>
            )
          }

          return (
            <Link key={action.id} href={action.href}>
              <Button
                variant={action.variant || 'outline'}
                size="sm"
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </Button>
            </Link>
          )
        }

        return (
          <Button
            key={action.id}
            variant={action.variant || 'outline'}
            size="sm"
            onClick={action.onClick}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            {action.label}
          </Button>
        )
      })}
    </div>
  )
}
