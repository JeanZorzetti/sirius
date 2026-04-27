'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Key, Copy, Check, Trash2, Plus, AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  lastUsed: string | null
  requestCount: number
  createdAt: string
}

export default function ApiManagementPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [showKeyDialog, setShowKeyDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState('')
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    loadApiKeys()
  }, [])

  async function loadApiKeys() {
    try {
      const response = await fetch('/api/v1/api-keys')
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.apiKeys || [])
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao carregar API keys')
      }
    } catch (error) {
      toast.error('Erro ao carregar API keys')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateKey() {
    if (!newKeyName.trim()) {
      toast.error('Nome da API key é obrigatório')
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() })
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedKey(data.apiKey.key)
        setShowGenerateDialog(false)
        setShowKeyDialog(true)
        setNewKeyName('')
        loadApiKeys()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao gerar API key')
      }
    } catch (error) {
      toast.error('Erro ao gerar API key')
    } finally {
      setGenerating(false)
    }
  }

  async function handleRevokeKey(id: string, name: string) {
    try {
      const response = await fetch(`/api/v1/api-keys/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('API key revogada com sucesso')
        loadApiKeys()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao revogar API key')
      }
    } catch (error) {
      toast.error('Erro ao revogar API key')
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('API key copiada!')
    setTimeout(() => setCopied(false), 2000)
  }

  function formatDate(date: string | null) {
    if (!date) return 'Nunca'
    return new Date(date).toLocaleString('pt-BR')
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>
      <div className="flex items-center justify-between space-y-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">API KEYS</h2>
          <p className="text-sm text-zinc-500">Gerencie suas chaves de API para integração</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="grid gap-6 max-w-4xl">
          <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 ring-1 ring-white/5">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Chaves de API</CardTitle>
                  <CardDescription className="text-xs">Uma chave por organização</CardDescription>
                </div>
              </div>
              {apiKeys.length === 0 && (
                <Button onClick={() => setShowGenerateDialog(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Gerar API Key
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  Nenhuma API key encontrada. Gere uma para começar a usar a API.
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-4 border border-zinc-200 dark:border-white/10 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                          {key.name}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1 font-mono">
                          {key.keyPrefix}••••••••••••••••
                        </div>
                        <div className="flex gap-4 mt-2 text-xs text-zinc-500">
                          <span>Último uso: {formatDate(key.lastUsed)}</span>
                          <span>Requests: {key.requestCount.toLocaleString()}</span>
                          <span>Criado: {formatDate(key.createdAt)}</span>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setRevokeTarget({ id: key.id, name: key.name })}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Revogar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
              <p>• A API key será exibida apenas uma vez após a geração. Guarde-a em local seguro.</p>
              <p>• Não compartilhe sua API key publicamente ou em repositórios Git.</p>
              <p>• Use variáveis de ambiente para armazenar sua API key em produção.</p>
              <p>• Revogue imediatamente qualquer chave comprometida.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Generate Key Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Nova API Key</DialogTitle>
            <DialogDescription>
              Dê um nome descritivo para identificar esta chave.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="keyName">Nome da API Key</Label>
              <Input
                id="keyName"
                placeholder="Ex: Produção, Desenvolvimento, Integração Zapier"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGenerateKey()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateKey} disabled={generating}>
              {generating ? 'Gerando...' : 'Gerar API Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Generated Key Dialog */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              API Key Gerada com Sucesso!
            </DialogTitle>
            <DialogDescription>
              Esta é a única vez que a chave completa será exibida. Copie e guarde em local seguro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono break-all flex-1">{generatedKey}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generatedKey)}
                  className="ml-2"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                Guarde esta chave em local seguro. Você não conseguirá vê-la novamente.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowKeyDialog(false)}>
              Entendi, fechei a chave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Revogar API key"
        description={`Tem certeza que deseja revogar a API key "${revokeTarget?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Revogar"
        onConfirm={() => {
          if (revokeTarget) {
            handleRevokeKey(revokeTarget.id, revokeTarget.name)
            setRevokeTarget(null)
          }
        }}
      />
    </div>
  )
}
