'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { getDealDetails, addNote, deleteNote } from '@/app/[locale]/dashboard/deals/actions'
import { NoteItem } from './timeline-items'
import type { DealNote, FullDeal } from './types'

export function NotesTab({
    dealId,
    notes,
    fetchingDetails,
    onDetailsChange,
}: {
    dealId: string
    notes: DealNote[] | undefined
    fetchingDetails: boolean
    onDetailsChange: (fresh: FullDeal) => void
}) {
    const tCommon = useTranslations('common')
    const [newNote, setNewNote] = useState('')
    const [isPending, startTransition] = useTransition()
    const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<string | null>(null)

    const handleAddNote = () => {
        if (!newNote.trim()) return
        startTransition(async () => {
            try {
                await addNote(dealId, newNote)
                setNewNote("")
                // Refresh details
                const fresh = await getDealDetails(dealId)
                onDetailsChange(fresh)
            } catch (err) {
                console.error("Failed to add note:", err)
                alert("Erro ao adicionar observação. O deal pode não existir mais.")
            }
        })
    }

    return (
        <>
            <div className="flex gap-2">
                <Input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Escreva uma observação..."
                    className="bg-zinc-50 dark:bg-zinc-900/50"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <Button onClick={handleAddNote} disabled={!newNote.trim() || isPending} size="icon" className="shrink-0 bg-indigo-600">
                    <Send className="w-4 h-4" />
                </Button>
            </div>

            <div className="space-y-4 pt-4">
                {fetchingDetails ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-zinc-400" /></div>
                ) : notes?.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400 text-sm">Nenhuma observação ainda.</div>
                ) : (
                    notes?.map((note) => (
                        <NoteItem key={note.id} note={note} onDelete={() => {
                            setConfirmDeleteNoteId(note.id)
                        }} />
                    ))
                )}
            </div>

            <ConfirmDialog
                open={!!confirmDeleteNoteId}
                onOpenChange={(open) => !open && setConfirmDeleteNoteId(null)}
                title="Excluir nota"
                description="Tem certeza que deseja excluir esta nota?"
                confirmLabel={tCommon('buttons.delete')}
                onConfirm={async () => {
                    if (confirmDeleteNoteId) {
                        try {
                            await deleteNote(confirmDeleteNoteId)
                            const fresh = await getDealDetails(dealId)
                            onDetailsChange(fresh)
                        } catch {
                            toast.error("Erro ao excluir nota")
                        }
                    }
                    setConfirmDeleteNoteId(null)
                }}
            />
        </>
    )
}
