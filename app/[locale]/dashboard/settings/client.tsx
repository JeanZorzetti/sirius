'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProfileForm } from '@/components/settings/profile-form'
import { QuickActions } from '@/components/settings/quick-actions'
import { ViewModeToggle, ViewMode } from '@/components/settings/view-mode-toggle'
import { User, Users, Key, Webhook, Zap, Bell, BookOpen, CreditCard, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { useAppBar } from '@/components/mobile/app-bar-context'

interface SettingsClientProps {
  user: {
    name: string | null
    email: string
    organization: {
      name: string
      tier: string
    } | null
  }
}

export function SettingsClient({ user }: SettingsClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('expanded')
  const { setConfig } = useAppBar()

  useEffect(() => {
    setConfig({ title: 'Configurações' })
    return () => setConfig(null)
  }, [])

  const handleExportData = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Exportando dados...',
        success: 'Dados exportados com sucesso!',
        error: 'Erro ao exportar dados',
      }
    )
  }

  const isCompact = viewMode === 'compact'

  return (
    <div className="px-4 py-4 md:p-8 md:pt-6 space-y-6">
      {/* Header com Quick Actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Configurações
            </h1>
            {user.organization && (
              <Badge variant="outline" className="font-normal">
                {user.organization.name}
              </Badge>
            )}
            {user.organization?.tier === 'PRO' && (
              <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
                PRO
              </Badge>
            )}
            {user.organization?.tier === 'BUSINESS' && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">
                BUSINESS
              </Badge>
            )}
          </div>
          <p className="text-zinc-500 dark:text-zinc-400">
            Gerencie suas preferências e dados da conta
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <QuickActions onExportData={handleExportData} />
        </div>
      </div>

      <div className="grid gap-8 max-w-3xl">
        {/* SEÇÃO: CONTA */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Conta
          </h3>
          <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm">
            <CardHeader className={cn(
              'flex flex-row items-center gap-4 relative overflow-hidden',
              isCompact && 'pb-3'
            )}>
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                <User className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Perfil
                </CardTitle>
                {!isCompact && (
                  <CardDescription className="text-zinc-500 text-xs">
                    Atualize suas informações pessoais
                  </CardDescription>
                )}
              </div>
            </CardHeader>
            {!isCompact && (
              <CardContent className="pt-0">
                <ProfileForm initialData={{ name: user.name || '', email: user.email, organizationName: user.organization?.name || '' }} />
              </CardContent>
            )}
          </Card>
        </div>

        {/* SEÇÃO: ASSINATURA */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Assinatura
          </h3>

          <Link href="/dashboard/settings/billing">
            <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-500/30 hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group">
              <CardHeader className="flex flex-row items-center gap-4 relative overflow-hidden">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    Assinatura & Pagamento
                    {user.organization?.tier && user.organization.tier !== 'FREE' && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20">
                        {user.organization.tier}
                      </span>
                    )}
                  </CardTitle>
                  {!isCompact && (
                    <CardDescription className="text-zinc-500 text-xs">
                      Gerencie seu plano e histórico de pagamentos
                    </CardDescription>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-200" />
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* SEÇÃO: TIME & COLABORAÇÃO */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Time & Colaboração
          </h3>

          <Link href="/dashboard/settings/team">
            <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group">
              <CardHeader className="flex flex-row items-center gap-4 relative overflow-hidden">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Time
                  </CardTitle>
                  {!isCompact && (
                    <CardDescription className="text-zinc-500 text-xs">
                      Gerencie membros e convites
                    </CardDescription>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-200" />
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/settings/notifications">
            <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group">
              <CardHeader className="flex flex-row items-center gap-4 relative overflow-hidden">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Notificações
                  </CardTitle>
                  {!isCompact && (
                    <CardDescription className="text-zinc-500 text-xs">
                      Configure suas preferências de notificação
                    </CardDescription>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" />
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* SEÇÃO: DESENVOLVEDORES */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Desenvolvedores
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/dashboard/settings/api">
              <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-500/30 hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group">
                <CardHeader className="flex flex-row items-center gap-4 relative overflow-hidden">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                    <Key className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      API Keys
                    </CardTitle>
                    {!isCompact && (
                      <CardDescription className="text-zinc-500 text-xs">
                        Gerencie chaves de API
                      </CardDescription>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-200" />
                </CardHeader>
              </Card>
            </Link>

            <Link href="/dashboard/settings/webhooks">
              <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group">
                <CardHeader className="flex flex-row items-center gap-4 relative overflow-hidden">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                    <Webhook className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      Webhooks
                    </CardTitle>
                    {!isCompact && (
                      <CardDescription className="text-zinc-500 text-xs">
                        Configure webhooks para eventos
                      </CardDescription>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" />
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* SEÇÃO: INTEGRAÇÕES */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Integrações
          </h3>

          <Link href="/dashboard/settings/integrations">
            <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-500/30 hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group">
              <CardHeader className="flex flex-row items-center gap-4 relative overflow-hidden">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Integrações
                  </CardTitle>
                  {!isCompact && (
                    <CardDescription className="text-zinc-500 text-xs">
                      N8N, WhatsApp e Google Calendar
                    </CardDescription>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all duration-200" />
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* SEÇÃO: RECURSOS */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Recursos
          </h3>
          <a href="/help" target="_blank" rel="noopener noreferrer">
            <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm hover:shadow-md hover:border-green-300 dark:hover:border-green-500/30 hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-all duration-200 cursor-pointer group">
              <CardHeader className="flex flex-row items-center gap-4 relative overflow-hidden">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 ring-1 ring-white/5 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Ajuda e Suporte
                  </CardTitle>
                  {!isCompact && (
                    <CardDescription className="text-zinc-500 text-xs">
                      Central de ajuda, tutoriais e guias completos
                    </CardDescription>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-zinc-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all duration-200" />
              </CardHeader>
            </Card>
          </a>
        </div>
      </div>
    </div>
  )
}
