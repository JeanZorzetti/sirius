'use client'

import Link from 'next/link'
import { AVISO_INTEGRADOR } from '@/lib/termos'

/**
 * Risk notice before connecting a WhatsApp integrator (terms section 6.2). Unchecked by default and `required`,
 * so the connection form cannot submit without it; send `aceite: true` to the route, which calls
 * registrarAceiteIntegrador() before activating anything.
 */
export function AceiteIntegrador({ checked, onChange }: { checked: boolean; onChange: (aceite: boolean) => void }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border p-3">
      <input
        id="aceite-integrador"
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        required
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
      />
      <label htmlFor="aceite-integrador" className="text-sm leading-snug">
        {AVISO_INTEGRADOR}{' '}
        <Link href="/terms#whatsapp" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-destaque">
          Termos de Uso, seção 6<span className="sr-only"> (abre em nova aba)</span>
        </Link>
      </label>
    </div>
  )
}
