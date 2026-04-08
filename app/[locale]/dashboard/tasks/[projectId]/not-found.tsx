import Link from 'next/link'
import { FolderKanban, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProjectNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40">
          <FolderKanban className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold tracking-tighter text-foreground">
          Projeto não encontrado
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Este projeto não existe ou foi removido.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-6 gap-1.5">
          <Link href="/dashboard/tasks">
            <ChevronLeft className="h-3 w-3" />
            Voltar aos projetos
          </Link>
        </Button>
      </div>
    </div>
  )
}
