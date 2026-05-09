'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RotateCcw, LayoutDashboard } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md mx-auto text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 mb-4">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-xl font-bold mb-2">Erro no Dashboard</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Algo deu errado ao carregar esta página. Tente novamente.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>
        {error.digest && (
          <p className="text-xs text-muted-foreground mt-4">
            Código: {error.digest}
          </p>
        )}
        {/* TEMP DEBUG — remove after identifying root cause */}
        <details className="mt-4 text-left">
          <summary className="text-xs text-muted-foreground cursor-pointer">Detalhes do erro</summary>
          <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">
            {error?.message || '(sem mensagem)'}{'\n\n'}{error?.stack || '(sem stack)'}
          </pre>
        </details>
      </div>
    </div>
  )
}
