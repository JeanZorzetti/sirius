'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  ColumnDef,
  Row,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
} from '@tanstack/react-table'
import { TableVirtuoso, VirtuosoGrid } from 'react-virtuoso'
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
import { useTranslations } from 'next-intl'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  renderMobileCard?: (row: Row<TData>) => React.ReactNode
  onRowClick?: (row: Row<TData>) => void
}

// Threshold: rows above this number trigger virtualization
const VIRTUALIZE_THRESHOLD = 50

export function DataTable<TData extends { id: string }, TValue>({
  columns,
  data,
  renderMobileCard,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const tCommon = useTranslations('common')
  const t = useTranslations('components.contacts')
  const [globalFilter, setGlobalFilter] = useState('')
  const [debouncedFilter, setDebouncedFilter] = useState('')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const router = useRouter()

  // Debounce filter input — typing was triggering full table re-filter on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilter(globalFilter), 250)
    return () => clearTimeout(t)
  }, [globalFilter])

  const tableInitRef = useRef(performance.now())
  useEffect(() => {
    console.log(
      `%c[PERF-CLIENT] DataTable mounted`,
      'color: #4f46e5; font-weight: bold',
      `\n  rows: ${data.length}`,
      `\n  columns: ${columns.length}`,
      `\n  init→mount: ${(performance.now() - tableInitRef.current).toFixed(1)}ms`,
      `\n  virtualized: ${data.length >= VIRTUALIZE_THRESHOLD}`
    )
  }, [])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: 'includesString',
    enableRowSelection: true,
    state: {
      globalFilter: debouncedFilter,
      rowSelection,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
  })

  const rows = table.getRowModel().rows
  const selectedRows = table.getSelectedRowModel().rows
  const selectedCount = selectedRows.length
  const filteredCount = table.getFilteredRowModel().rows.length

  const headerGroups = useMemo(() => table.getHeaderGroups(), [table, columns])

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
        toast.error(result.error || tCommon('toasts.failedDelete'))
      }
    } catch {
      toast.error(tCommon('toasts.failedDelete'))
    } finally {
      setBulkDeleting(false)
    }
  }

  const shouldVirtualize = data.length >= VIRTUALIZE_THRESHOLD

  return (
    <div className="flex flex-col gap-4">
      {/* Search + Bulk Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder={t('searchPlaceholder')}
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
              {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {tCommon('buttons.delete')} selecionados
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRowSelection({})}
              className="h-9 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              {tCommon('buttons.cancel')}
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div
        className={cn(
          'rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-white/[0.02] backdrop-blur-xl shadow-sm overflow-hidden',
          renderMobileCard ? 'hidden lg:block' : '',
        )}
      >
        {rows.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-zinc-500 text-sm">
            {debouncedFilter ? 'Nenhum resultado para a busca.' : 'Nenhum resultado encontrado.'}
          </div>
        ) : shouldVirtualize ? (
          <TableVirtuoso
            style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}
            totalCount={rows.length}
            overscan={200}
            components={{
              Table: (props) => (
                <table
                  {...props}
                  className="w-full caption-bottom text-sm border-separate border-spacing-0"
                  style={{ ...props.style, tableLayout: 'fixed', minWidth: '1100px' }}
                >
                  <colgroup>
                    {table.getVisibleLeafColumns().map((col) => (
                      <col key={col.id} style={{ width: `${col.getSize()}px` }} />
                    ))}
                  </colgroup>
                  {props.children}
                </table>
              ),
              TableHead: (props: any) => (
                <thead {...props} className="bg-black/[0.02] dark:bg-white/[0.02] sticky top-0 z-10" />
              ),
              TableRow: ({ item: _item, ...props }: any) => {
                const row = rows[props['data-index']]
                if (!row) return <tr {...props} />
                return (
                  <tr
                    {...props}
                    data-state={row.getIsSelected() && 'selected'}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group data-[state=selected]:bg-indigo-50/50 dark:data-[state=selected]:bg-indigo-500/5',
                      onRowClick && 'cursor-pointer'
                    )}
                  />
                )
              },
              TableBody: (props) => <tbody {...props} />,
            }}
            fixedHeaderContent={() =>
              headerGroups.map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-black/5 dark:border-white/5">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: `${header.getSize()}px` }}
                      className="text-xs uppercase tracking-wider font-semibold text-zinc-600 dark:text-zinc-500 h-10 px-4 text-left bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5"
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))
            }
            itemContent={(index) => {
              const row = rows[index]
              if (!row) return null
              return row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  style={{ width: `${cell.column.getSize()}px`, maxWidth: `${cell.column.getSize()}px` }}
                  className="py-3 px-4 text-zinc-700 dark:text-zinc-300 align-middle overflow-hidden"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))
            }}
          />
        ) : (
          // Non-virtualized for small datasets — same DOM as before
          <table className="w-full caption-bottom text-sm">
            <thead className="bg-black/[0.02] dark:bg-white/[0.02]">
              {headerGroups.map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-black/5 dark:border-white/5">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-xs uppercase tracking-wider font-semibold text-zinc-600 dark:text-zinc-500 h-10 px-4 text-left"
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group data-[state=selected]:bg-indigo-50/50 dark:data-[state=selected]:bg-indigo-500/5',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-4 text-zinc-700 dark:text-zinc-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile Cards — virtualized via VirtuosoGrid for large lists */}
      {renderMobileCard && (
        <div className="lg:hidden">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-white/[0.02] p-8 text-center text-sm text-zinc-500">
              {debouncedFilter ? 'Nenhum resultado para a busca.' : 'Nenhum resultado encontrado.'}
            </div>
          ) : shouldVirtualize ? (
            <VirtuosoGrid
              style={{ height: 'calc(100vh - 200px)', minHeight: '400px' }}
              totalCount={rows.length}
              overscan={400}
              listClassName="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4"
              itemContent={(index) => {
                const row = rows[index]
                if (!row) return null
                return <>{renderMobileCard(row)}</>
              }}
            />
          ) : (
            <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
              {rows.map((row) => (
                <div key={row.id}>{renderMobileCard(row)}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Row count */}
      <div className="text-xs text-zinc-500">
        {selectedCount > 0
          ? `${selectedCount} de ${filteredCount} selecionado(s)`
          : `${filteredCount} de ${data.length} contato(s)`}
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
            <AlertDialogCancel>{tCommon('buttons.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {tCommon('buttons.delete')} {selectedCount} contato{selectedCount !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
