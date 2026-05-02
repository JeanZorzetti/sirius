'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, CheckCircle2, ExternalLink,
  Loader2, AlertCircle, RefreshCw, Instagram,
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

interface InstagramStatus {
  connected: boolean
  instagramBusinessAccountId?: string | null
}

export default function InstagramSettingsClient() {
  const searchParams = useSearchParams()

  const [status, setStatus]     = useState<InstagramStatus>({ connected: false })
  const [isLoading, setIsLoading] = useState(true)

  const loadStatus = useCallback(async () => {
    try {
      const res  = await fetch('/api/settings/instagram')
      const data = await res.json()
      setStatus(data)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  // Trata retorno do OAuth
  useEffect(() => {
    const success = searchParams.get('success')
    const error   = searchParams.get('error')

    if (success === 'connected') {
      toast.success('Instagram conectado com sucesso!')
      loadStatus()
    } else if (error === 'denied') {
      toast.error('Autorizacao negada pelo Facebook/Instagram.')
    } else if (error === 'no_instagram_account') {
      toast.error('Nenhuma conta Instagram Business encontrada vinculada a uma Pagina do Facebook.')
    } else if (error) {
      toast.error(`Erro ao conectar: ${error}`)
    }
  }, [searchParams, loadStatus])

  const handleConnect = () => {
    window.location.href = '/api/auth/instagram'
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings/integrations">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Integracoes
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-pink-600/10 flex items-center justify-center shadow-[0_0_10px_rgba(219,39,119,0.2)]">
          <Instagram className="h-6 w-6 text-pink-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Instagram</h2>
            {status.connected && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Publique posts, carrossis e stories automaticamente via API oficial da Meta
          </p>
        </div>
      </div>

      <Card className={status.connected ? 'border-green-200 dark:border-green-800' : ''}>
        <CardHeader>
          <CardTitle className="text-base">Conexao com Instagram Business</CardTitle>
          <CardDescription>
            Autorize o Sirius CRM a publicar conteudo na sua conta Instagram Business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : status.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Instagram Business conectado
                  </p>
                  {status.instagramBusinessAccountId && (
                    <p className="text-xs text-green-700 dark:text-green-300 font-mono mt-0.5">
                      ID: {status.instagramBusinessAccountId}
                    </p>
                  )}
                  <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                    Posts agendados serao publicados automaticamente
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleConnect} className="gap-2">
                <RefreshCw className="h-3 w-3" />
                Reconectar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800">
                <AlertCircle className="h-4 w-4 text-pink-600 shrink-0 mt-0.5" />
                <div className="text-sm text-pink-800 dark:text-pink-200 space-y-1">
                  <p className="font-medium">Pre-requisitos:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Voce precisa ter uma <strong>Pagina do Facebook</strong></li>
                    <li>Sua conta do Instagram deve ser <strong>Business ou Creator</strong></li>
                    <li>A conta Instagram deve estar <strong>vinculada a Pagina do Facebook</strong></li>
                  </ol>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <p className="font-medium">Como funciona:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Clique em "Conectar Instagram" abaixo</li>
                    <li>Autorize o Sirius CRM via Facebook Login</li>
                    <li>O sistema detecta automaticamente sua conta Instagram Business</li>
                    <li>Posts agendados serao publicados automaticamente</li>
                  </ol>
                </div>
              </div>
              <Button
                onClick={handleConnect}
                className="w-full sm:w-auto gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
              >
                <Instagram className="h-4 w-4" />
                Conectar Instagram
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ExternalLink className="h-3 w-3" />
        <a
          href="https://developers.facebook.com/docs/instagram-api/guides/content-publishing"
          target="_blank"
          rel="noopener"
          className="underline"
        >
          Documentacao oficial — Instagram Content Publishing API
        </a>
      </div>
    </div>
  )
}
