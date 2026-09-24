'use client'

import { useState, FormEvent } from 'react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function NewsletterCTA() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
      })
      setStatus('success')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="mt-12 mb-4 rounded-xl p-8 sm:p-10">
      <div className="mx-auto max-w-xl text-center">
        <h3 className="text-xl font-bold text-foreground sm:text-2xl">
          Receba dicas de vendas e CRM por email
        </h3>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed sm:text-base">
          Conteudo exclusivo sobre prospeccao, automacao e IA para vendedores B2B.
          Sem spam — 1 email por semana.
        </p>

        {status === 'success' ? (
          <p className="mt-6 text-sm font-medium text-muted-foreground">
            Inscrito! Cheque seu email.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-2"
          >
            <input
              type="email"
              required
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-destaque disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Enviando...' : 'Inscrever'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="mt-3 text-sm text-muted-foreground">
            Ocorreu um erro. Tente novamente.
          </p>
        )}
      </div>
    </div>
  )
}
