'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

/**
 * ResponsiveDialog — renderiza um Dialog tradicional em desktop (>= lg)
 * e um bottom Sheet fullscreen em mobile.
 *
 * Uso:
 * ```tsx
 * <ResponsiveDialog open={open} onOpenChange={setOpen}>
 *   <ResponsiveDialogTrigger asChild><Button>Abrir</Button></ResponsiveDialogTrigger>
 *   <ResponsiveDialogContent className="sm:max-w-[500px]">
 *     <ResponsiveDialogHeader>
 *       <ResponsiveDialogTitle>Título</ResponsiveDialogTitle>
 *       <ResponsiveDialogDescription>Descrição</ResponsiveDialogDescription>
 *     </ResponsiveDialogHeader>
 *     <form>...</form>
 *     <ResponsiveDialogFooter>...</ResponsiveDialogFooter>
 *   </ResponsiveDialogContent>
 * </ResponsiveDialog>
 * ```
 *
 * Detecta `(min-width: 1024px)` — mesmo breakpoint `lg:` do Tailwind,
 * alinhado com o resto da base mobile.
 */

interface ResponsiveDialogContextValue {
  isDesktop: boolean
}

const ResponsiveDialogContext = React.createContext<ResponsiveDialogContextValue>({
  isDesktop: true,
})

function useResponsiveDialogContext() {
  return React.useContext(ResponsiveDialogContext)
}

interface ResponsiveDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function ResponsiveDialog({ open, onOpenChange, children }: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return (
    <ResponsiveDialogContext.Provider value={{ isDesktop }}>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={onOpenChange}>
          {children}
        </Dialog>
      ) : (
        <Sheet open={open} onOpenChange={onOpenChange}>
          {children}
        </Sheet>
      )}
    </ResponsiveDialogContext.Provider>
  )
}

interface ResponsiveDialogTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

export function ResponsiveDialogTrigger({ asChild, children }: ResponsiveDialogTriggerProps) {
  const { isDesktop } = useResponsiveDialogContext()
  return isDesktop ? (
    <DialogTrigger asChild={asChild}>{children}</DialogTrigger>
  ) : (
    <SheetTrigger asChild={asChild}>{children}</SheetTrigger>
  )
}

interface ResponsiveDialogContentProps {
  className?: string
  children: React.ReactNode
  /**
   * Quando renderizado como Sheet (mobile), essa classe é aplicada
   * no SheetContent. Útil para controlar altura máxima.
   */
  mobileClassName?: string
}

export function ResponsiveDialogContent({
  className,
  mobileClassName,
  children,
}: ResponsiveDialogContentProps) {
  const { isDesktop } = useResponsiveDialogContext()

  if (isDesktop) {
    return <DialogContent className={className}>{children}</DialogContent>
  }

  return (
    <SheetContent
      side="bottom"
      className={cn(
        // Drag handle visual no topo + scroll interno + safe-area bottom
        'max-h-[92vh] gap-0 overflow-y-auto rounded-t-2xl p-0 pb-[env(safe-area-inset-bottom)]',
        // Drag-handle pseudo element
        'before:mx-auto before:mt-2 before:block before:h-1 before:w-10 before:rounded-full before:bg-zinc-300 before:dark:bg-zinc-700',
        mobileClassName,
      )}
    >
      <div className="flex flex-col gap-4 p-4">{children}</div>
    </SheetContent>
  )
}

export function ResponsiveDialogHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { isDesktop } = useResponsiveDialogContext()
  return isDesktop ? (
    <DialogHeader className={className} {...props} />
  ) : (
    <SheetHeader className={cn('p-0 text-left', className)} {...props} />
  )
}

export function ResponsiveDialogFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { isDesktop } = useResponsiveDialogContext()
  return isDesktop ? (
    <DialogFooter className={className} {...props} />
  ) : (
    <SheetFooter className={cn('mt-auto flex flex-col gap-2 p-0 pt-4', className)} {...props} />
  )
}

export function ResponsiveDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  const { isDesktop } = useResponsiveDialogContext()
  return isDesktop ? (
    <DialogTitle className={className} {...props} />
  ) : (
    <SheetTitle className={cn('text-lg leading-none font-semibold', className)} {...props} />
  )
}

export function ResponsiveDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  const { isDesktop } = useResponsiveDialogContext()
  return isDesktop ? (
    <DialogDescription className={className} {...props} />
  ) : (
    <SheetDescription className={className} {...props} />
  )
}
