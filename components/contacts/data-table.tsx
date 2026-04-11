'use client'

import { useState } from 'react'
import {
  ColumnDef,
  Row,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  RowSelectionState,
} from '@tanstack/react-table'
import { Search, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { bulkDeleteContacts } from '@/app/[locale]/dashboard/contacts/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /**
   * Renderiza cada row como um card no mobile (<lg). Se não fornecido,
   * mantém a tabela com scroll horizontal (comportamento legado).
   */
  renderMobileCard?: (row: Row<TData>) => React.ReactNode
}

export function DataTable<TData extends { id: string }, TValue>({
  columns,
  data,
  renderMobileCard,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const router = useRouter()

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
    enableRowSelection: true,
    state: {
      globalFilter,
      rowSelection,
    },
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
  })

  const selectedRows = table.getSelectedRowModel().rows
  const selectedCount = selectedRows.length

  async function handleBulkDelete() {
    setBulkDeleting(true)
    setConfirmOpen(false)
    try {
      const ids = selectedRows.map((r) => r.original.id)
      const result = await bulkDeleteContacts(ids)
      if (result.success) {
        toast.success(`${result.deleted} contato(s) excluído(s)`)
        setRowSelection({})
        router.refresh()
      } else {
        toast.error(result.error || 'Falha ao excluir contatos')
      }
    } catch {
      toast.error('Erro ao excluir contatos')
    } finally {
      setBulkDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search + Bulk Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Buscar contatos..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 bg-white dark:bg-white/[0.02] border-black/10 dark:border-white/10 h-9"
          />
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300">
              {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmOpen(true)}
              disabled={bulkDeleting}
              className="h-9 gap-2 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 border border-red-200 dark:border-red-500/20"
            >
              {bulkDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Excluir selecionados
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRowSelection({})}
              className="h-9 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Cancelar
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Table — escondida em <lg quando há renderMobileCard */}
      <div
        className={cn(
          'rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-white/[0.02] backdrop-blur-xl shadow-sm',
          renderMobileCard ? 'hidden lg:block overflow-hidden' : 'overflow-x-auto',
        )}
      >
        <Table>
          <TableHeader className="bg-black/[0.02] dark:bg-white/[0.02]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-black/5 dark:border-white/5 hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="text-xs uppercase tracking-wider font-semibold text-zinc-600 dark:text-zinc-500 h-10">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group data-[state=selected]:bg-indigo-50/50 dark:data-[state=selected]:bg-indigo-500/5"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 text-zinc-700 dark:text-zinc-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-zinc-500">
                  {globalFilter ? 'Nenhum resultado para a busca.' : 'Nenhum resultado encontrado.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards — só aparecem quando renderMobileCard é fornecido */}
      {renderMobileCard && (
        <div className="flex flex-col gap-3 lg:hidden">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <div key={row.id}>{renderMobileCard(row)}</div>
            ))
          ) : (
            <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-white/[0.02] p-8 text-center text-sm text-zinc-500">
              {globalFilter ? 'Nenhum resultado para a busca.' : 'Nenhum resultado encontrado.'}
            </div>
          )}
        </div>
      )}

      {/* Row count */}
      <div className="text-xs text-zinc-500">
        {selectedCount > 0
          ? `${selectedCount} de ${table.getFilteredRowModel().rows.length} selecionado(s)`
          : `${table.getFilteredRowModel().rows.length} de ${data.length} contato(s)`}
      </div>

      {/* Bulk delete confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedCount} contato{selectedCount !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Contatos com negócios vinculados não serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir {selectedCount} contato{selectedCount !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
