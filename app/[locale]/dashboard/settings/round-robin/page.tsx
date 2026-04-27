'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Loader2, Users, RotateCw, Building2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  name: string | null
  email: string
}

interface RoundRobinConfig {
  enabled: boolean
  userIds: string[]
  assignToOwner: boolean
  skipIfOffline: boolean
  notifyUsers: boolean
}

export default function RoundRobinSettingsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [config, setConfig] = useState<RoundRobinConfig>({
    enabled: false,
    userIds: [],
    assignToOwner: false,
    skipIfOffline: true,
    notifyUsers: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isBusiness, setIsBusiness] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usersRes, configRes, entitlementsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/round-robin/config'),
        fetch('/api/entitlements'),
      ])

      if (usersRes.ok) {
        setUsers(await usersRes.json())
      }

      if (configRes.ok) {
        setConfig(await configRes.json())
      }

      if (entitlementsRes.ok) {
        const entitlements = await entitlementsRes.json()
        setIsBusiness(entitlements.tier === 'BUSINESS')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/round-robin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (res.ok) {
        toast.success('Configuração salva!')
      } else {
        toast.error('Erro ao salvar')
      }
    } catch (error) {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const toggleUser = (userId: string) => {
    setConfig(prev => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter(id => id !== userId)
        : [...prev.userIds, userId],
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isBusiness) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-bold">Distribuição Round-Robin</h1>
          <p className="text-muted-foreground">
            Distribua leads automaticamente entre sua equipe
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Recurso Exclusivo Business</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              O round-robin de leads está disponível apenas no plano Business.
              Faça upgrade para automatizar a distribuição de leads.
            </p>
            <Button asChild>
              <a href="/dashboard/billing/plans">Ver Planos</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold">Distribuição Round-Robin</h1>
        <p className="text-muted-foreground">
          Distribua leads automaticamente entre os membros da equipe
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ativar Round-Robin</CardTitle>
              <CardDescription>
                Distribuir leads automaticamente entre os usuários selecionados
              </CardDescription>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => 
                setConfig(prev => ({ ...prev, enabled: checked }))
              }
            />
          </div>
        </CardHeader>
      </Card>

      {config.enabled && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuários na Rotação
              </CardTitle>
              <CardDescription>
                Selecione os usuários que receberão leads via round-robin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <Checkbox
                      checked={config.userIds.includes(user.id)}
                      onCheckedChange={() => toggleUser(user.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{user.name || 'Sem nome'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    {config.userIds.includes(user.id) && (
                      <Badge variant="secondary">Ativo</Badge>
                    )}
                  </div>
                ))}

                {users.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum usuário encontrado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCw className="h-5 w-5" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pular usuários inativos</p>
                  <p className="text-sm text-muted-foreground">
                    Não atribuir leads a usuários sem atividade recente
                  </p>
                </div>
                <Switch
                  checked={config.skipIfOffline}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, skipIfOffline: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificar usuários</p>
                  <p className="text-sm text-muted-foreground">
                    Enviar notificação quando um lead for atribuído
                  </p>
                </div>
                <Switch
                  checked={config.notifyUsers}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, notifyUsers: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="flex justify-end">
        <Button onClick={saveConfig} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  )
}
