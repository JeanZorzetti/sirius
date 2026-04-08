'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateProjectDialog } from './create-project-dialog'

interface TasksHubActionsProps {
  variant?: 'default' | 'empty'
}

export function TasksHubActions({ variant = 'default' }: TasksHubActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size={variant === 'empty' ? 'default' : 'sm'}
        className="gap-1.5"
      >
        <Plus className="h-4 w-4" />
        Novo projeto
      </Button>
      <CreateProjectDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={(id) => router.push(`/dashboard/tasks/${id}`)}
      />
    </>
  )
}
