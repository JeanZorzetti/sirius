'use client'

import { useEffect } from 'react'

export default function IAError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[IA Error Boundary]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="max-w-md text-center">
        <h2 className="text-xl font-bold text-zinc-100 mb-2">Algo deu errado</h2>
        <p className="text-sm text-zinc-500 mb-1">
          {error.message || 'Erro desconhecido'}
        </p>
        {error.digest && (
          <p className="text-xs text-zinc-600 font-mono mb-4">
            Digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-medium hover:bg-zinc-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
