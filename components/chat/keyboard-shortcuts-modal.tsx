'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Keyboard } from 'lucide-react'

interface KeyboardShortcutsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Shortcut {
  keys: string[]
  description: string
}

interface ShortcutGroup {
  title: string
  shortcuts: Shortcut[]
}

const GROUPS: ShortcutGroup[] = [
  {
    title: 'Navegação',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Buscar conversas' },
      { keys: ['Esc'], description: 'Limpar resposta / Fechar modal / Voltar' },
      { keys: ['Ctrl', '/'], description: 'Mostrar esta lista de atalhos' },
    ],
  },
  {
    title: 'Composição',
    shortcuts: [
      { keys: ['Enter'], description: 'Enviar mensagem' },
      { keys: ['Shift', 'Enter'], description: 'Nova linha' },
      { keys: ['/'], description: 'Abrir respostas rápidas' },
    ],
  },
]

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 text-[11px] font-mono font-semibold text-zinc-700 dark:text-zinc-200 shadow-sm">
      {children}
    </kbd>
  )
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Atalhos de teclado
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {GROUPS.map(group => (
            <div key={group.title}>
              <p className="text-[11px] uppercase tracking-wide text-zinc-500 font-semibold mb-2">
                {group.title}
              </p>
              <div className="space-y-2">
                {group.shortcuts.map(sc => (
                  <div key={sc.description} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{sc.description}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {sc.keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="text-[10px] text-zinc-400">+</span>}
                          <Kbd>{k}</Kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-zinc-500 mt-4 text-center">
          Pressione <Kbd>Esc</Kbd> para fechar
        </p>
      </DialogContent>
    </Dialog>
  )
}
