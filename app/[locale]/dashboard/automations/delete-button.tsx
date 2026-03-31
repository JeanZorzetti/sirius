'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function DeleteAutomationButton({ automationId }: { automationId: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/automations/${automationId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Automação deletada com sucesso')
      router.refresh()
    } catch {
      toast.error('Erro ao deletar automação')
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={() => setConfirmOpen(true)}
      >
        Deletar
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Deletar automação"
        description="Tem certeza que deseja deletar esta automação? Esta ação não pode ser desfeita."
        confirmLabel="Deletar"
        onConfirm={handleDelete}
      />
    </>
  )
}
