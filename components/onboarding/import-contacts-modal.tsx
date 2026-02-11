'use client'

/**
 * ✅ FASE 15: Import de contatos via CSV/Excel no onboarding
 */

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileUp, Check, AlertCircle, Loader2, Download } from 'lucide-react'
import { toast } from 'sonner'
import Papa from 'papaparse'

interface ImportContactsModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (count: number) => void
}

interface ParsedContact {
  name: string
  email?: string
  phone?: string
  company?: string
  notes?: string
}

interface ImportPreview {
  contacts: ParsedContact[]
  errors: string[]
  total: number
}

// Mapeamento flexível de colunas
const COLUMN_MAP: Record<string, keyof ParsedContact> = {
  'nome': 'name', 'name': 'name', 'contato': 'name', 'cliente': 'name',
  'email': 'email', 'e-mail': 'email',
  'telefone': 'phone', 'phone': 'phone', 'celular': 'phone', 'whatsapp': 'phone', 'fone': 'phone',
  'empresa': 'company', 'company': 'company', 'organização': 'company', 'negócio': 'company',
  'notas': 'notes', 'notes': 'notes', 'observações': 'notes', 'obs': 'notes',
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function parseCSV(file: File): Promise<ImportPreview> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const contacts: ParsedContact[] = []
        const errors: string[] = []

        results.data.forEach((row: any, i: number) => {
          const mapped: Partial<ParsedContact> = {}

          Object.entries(row).forEach(([key, value]) => {
            const normalized = normalizeHeader(key)
            const field = COLUMN_MAP[normalized]
            if (field && value && String(value).trim()) {
              mapped[field] = String(value).trim()
            }
          })

          if (!mapped.name) {
            errors.push(`Linha ${i + 2}: campo "nome" não encontrado ou vazio`)
            return
          }

          contacts.push({
            name: mapped.name,
            email: mapped.email,
            phone: mapped.phone,
            company: mapped.company,
            notes: mapped.notes,
          })
        })

        resolve({ contacts, errors, total: results.data.length })
      },
      error: (err) => {
        resolve({ contacts: [], errors: [err.message], total: 0 })
      },
    })
  })
}

export function ImportContactsModal({ open, onClose, onSuccess }: ImportContactsModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [progress, setProgress] = useState(0)

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Formato inválido', { description: 'Aceite apenas arquivos .csv, .xlsx ou .xls' })
      return
    }

    // Para XLSX/XLS: converter para CSV via FileReader (papaparse aceita direto)
    const parsed = await parseCSV(file)
    setPreview(parsed)
    setStep('preview')
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleImport = async () => {
    if (!preview || preview.contacts.length === 0) return

    setStep('importing')
    setProgress(0)

    // Simular progresso enquanto aguarda resposta do servidor
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) { clearInterval(progressInterval); return prev }
        return prev + Math.random() * 15
      })
    }, 300)

    try {
      const response = await fetch('/api/onboarding/import-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: preview.contacts }),
      })

      clearInterval(progressInterval)
      setProgress(100)

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Erro ao importar')

      // Pequeno delay para o usuário ver 100%
      await new Promise(r => setTimeout(r, 400))

      setImportResult(data)
      setStep('done')
      onSuccess?.(data.imported)
    } catch (err: any) {
      clearInterval(progressInterval)
      setProgress(0)
      toast.error('Erro na importação', { description: err.message })
      setStep('preview')
    }
  }

  const handleClose = () => {
    setStep('upload')
    setPreview(null)
    setImportResult(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            Importar Contatos
          </DialogTitle>
          <DialogDescription>
            Importe seus contatos de uma planilha CSV ou Excel
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'
              }`}
              onClick={() => document.getElementById('csv-input')?.click()}
            >
              <FileUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">Arraste o arquivo ou clique para selecionar</p>
              <p className="text-sm text-muted-foreground mt-1">CSV, XLSX ou XLS (máx. 5MB)</p>
              <input
                id="csv-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>

            {/* Template Download */}
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium">Baixar modelo de planilha</p>
                <p className="text-xs text-muted-foreground">Com as colunas certas preenchidas</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const csv = 'nome,email,telefone,empresa,notas\nJoão Silva,joao@email.com,(11) 99999-9999,Empresa Exemplo,Cliente indicado por Ana'
                  const blob = new Blob([csv], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'modelo-contatos-sirius.csv'
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                Baixar
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Colunas aceitas: <strong>nome</strong>, email, telefone, empresa, notas
            </p>
          </div>
        )}

        {step === 'preview' && preview && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
              <Check className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium">
                {preview.contacts.length} contatos encontrados
                {preview.errors.length > 0 && `, ${preview.errors.length} linhas ignoradas`}
              </span>
            </div>

            {/* Preview Table */}
            <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium">Nome</th>
                    <th className="text-left p-2 font-medium">Email</th>
                    <th className="text-left p-2 font-medium">Empresa</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.contacts.slice(0, 10).map((c, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{c.name}</td>
                      <td className="p-2 text-muted-foreground text-xs">{c.email || '—'}</td>
                      <td className="p-2 text-muted-foreground text-xs">{c.company || '—'}</td>
                    </tr>
                  ))}
                  {preview.contacts.length > 10 && (
                    <tr className="border-t bg-muted/30">
                      <td colSpan={3} className="p-2 text-center text-muted-foreground text-xs">
                        + {preview.contacts.length - 10} contatos restantes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {preview.errors.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-xs text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Linhas ignoradas ({preview.errors.length}):</p>
                  {preview.errors.slice(0, 3).map((e, i) => <p key={i}>{e}</p>)}
                  {preview.errors.length > 3 && <p>e mais {preview.errors.length - 3}...</p>}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep('upload')} className="flex-1">
                Voltar
              </Button>
              <Button onClick={handleImport} className="flex-1" disabled={preview.contacts.length === 0}>
                Importar {preview.contacts.length} contatos
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
            <p className="font-medium">Importando contatos...</p>
            <div className="space-y-1">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{Math.round(Math.min(100, progress))}%</p>
            </div>
          </div>
        )}

        {step === 'done' && importResult && (
          <div className="py-6 text-center space-y-4">
            <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold">{importResult.imported} contatos importados!</p>
              {importResult.skipped > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {importResult.skipped} ignorados (emails duplicados)
                </p>
              )}
            </div>
            <Button onClick={() => { onSuccess?.(importResult.imported); handleClose() }} className="w-full">
              Ir para o Dashboard
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
