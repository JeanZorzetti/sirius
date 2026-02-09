import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export const dynamic = 'force-dynamic'

interface ContactRow {
  Nome?: string
  nome?: string
  name?: string
  Email?: string
  email?: string
  Telefone?: string
  telefone?: string
  phone?: string
  Celular?: string
  celular?: string
  Empresa?: string
  empresa?: string
  company?: string
  Cargo?: string
  cargo?: string
  role?: string
  Endereço?: string
  endereco?: string
  address?: string
  Cidade?: string
  cidade?: string
  city?: string
  Estado?: string
  estado?: string
  state?: string
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar usuário e organização
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 400 })
    }

    // Processar arquivo
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande (máx 5MB)' }, { status: 400 })
    }

    // Ler arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let rows: ContactRow[] = []

    // Processar conforme formato
    if (file.name.endsWith('.csv')) {
      const csvText = buffer.toString('utf-8')
      const result = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      })
      rows = result.data as ContactRow[]
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      rows = XLSX.utils.sheet_to_json(worksheet) as ContactRow[]
    } else {
      return NextResponse.json({ error: 'Formato não suportado' }, { status: 400 })
    }

    // Validar limite
    if (rows.length > 1000) {
      return NextResponse.json({ error: 'Máximo 1.000 linhas por importação' }, { status: 400 })
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Planilha vazia' }, { status: 400 })
    }

    // Processar contatos
    let success = 0
    let errors = 0
    let duplicates = 0
    const errorDetails: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // +2 porque linha 1 é header

      try {
        // Extrair dados (suporta múltiplos nomes de colunas)
        const name = row.Nome || row.nome || row.name || ''
        const email = row.Email || row.email || ''
        const phone = row.Telefone || row.telefone || row.phone || row.Celular || row.celular || ''
        const company = row.Empresa || row.empresa || row.company || ''
        const role = row.Cargo || row.cargo || row.role || ''
        const address = row.Endereço || row.endereco || row.address || ''
        const city = row.Cidade || row.cidade || row.city || ''
        const state = row.Estado || row.estado || row.state || ''

        // Validar dados mínimos
        if (!name) {
          errors++
          errorDetails.push(`Linha ${rowNum}: Nome é obrigatório`)
          continue
        }

        if (!email && !phone) {
          errors++
          errorDetails.push(`Linha ${rowNum}: Email ou Telefone é obrigatório`)
          continue
        }

        // Limpar telefone
        const cleanPhone = phone ? phone.replace(/\D/g, '') : ''
        const formattedPhone = cleanPhone ? (cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone) : ''

        // Verificar duplicados
        if (email || formattedPhone) {
          const existing = await prisma.contact.findFirst({
            where: {
              organizationId: user.organizationId,
              OR: [
                email ? { email } : {},
                formattedPhone ? { phone: formattedPhone } : {},
              ].filter(Boolean),
            },
          })

          if (existing) {
            duplicates++
            continue
          }
        }

        // Criar contato
        await prisma.contact.create({
          data: {
            organizationId: user.organizationId,
            name: name.trim(),
            email: email.trim() || null,
            phone: formattedPhone || null,
            company: company.trim() || null,
          },
        })

        success++
      } catch (error: any) {
        errors++
        errorDetails.push(`Linha ${rowNum}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success,
      errors,
      duplicates,
      total: rows.length,
      errorDetails: errorDetails.slice(0, 10), // Limitar detalhes
    })

  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar importação' },
      { status: 500 }
    )
  }
}
