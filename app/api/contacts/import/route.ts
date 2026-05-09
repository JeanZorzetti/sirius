import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export const dynamic = 'force-dynamic'

interface ContactRow {
  [key: string]: string | undefined
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getSession()
    if (!session?.user?.email) {
      return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
    }

    // Buscar usuário e organização
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true },
    })

    if (!user?.organizationId) {
      return await apiError(ERR.ORG_NOT_FOUND, 404, { req: request })
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
      // Lazy load XLSX apenas quando usuário faz upload de Excel
      const XLSX = await import('xlsx')
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

    // Processar contatos (enrich-or-create)
    let created = 0
    let enriched = 0
    let errors = 0
    const errorDetails: string[] = []

    // Build a normalized key lookup: lowercase+stripped → original key
    function getField(row: ContactRow, ...aliases: string[]): string {
      for (const alias of aliases) {
        // Try exact match first
        if (row[alias]) return String(row[alias]).trim()
      }
      // Fuzzy: normalize all keys and try matching
      const lowerAliases = aliases.map(a => a.toLowerCase().replace(/[-_\s]/g, ''))
      for (const key of Object.keys(row)) {
        const norm = key.toLowerCase().replace(/[-_\s]/g, '')
        if (lowerAliases.includes(norm) && row[key]) return String(row[key]).trim()
      }
      return ''
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // +2 porque linha 1 é header

      try {
        const name = getField(row, 'Nome', 'nome', 'name', 'Name')
        const email = getField(row, 'Email', 'email', 'E-mail', 'e-mail', 'E-Mail')
        const phone = getField(row, 'Telefone', 'telefone', 'phone', 'Phone', 'Celular', 'celular', 'Tel')
        const company = getField(row, 'Empresa', 'empresa', 'company', 'Company')
        const city = getField(row, 'Cidade', 'cidade', 'city', 'City')
        const state = getField(row, 'Estado', 'estado', 'state', 'State', 'UF', 'uf')

        // Validar dados mínimos
        if (!name && !email && !phone) {
          errors++
          errorDetails.push(`Linha ${rowNum}: Nome, Email ou Telefone é obrigatório`)
          continue
        }

        // Limpar telefone
        const cleanPhone = phone ? phone.replace(/\D/g, '') : ''
        const formattedPhone = cleanPhone ? (cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone) : ''

        // Buscar contato existente por email ou telefone
        let existing = null
        if (email || formattedPhone) {
          const orConditions = []
          if (email) orConditions.push({ email })
          if (formattedPhone) orConditions.push({ phone: formattedPhone })

          existing = await prisma.contact.findFirst({
            where: {
              organizationId: user.organizationId,
              OR: orConditions,
            },
          })
        }

        if (existing) {
          // Enriquecer: preencher campos vazios com dados da planilha
          const updates: Record<string, string> = {}
          if (!existing.name && name) updates.name = name
          if (!existing.email && email) updates.email = email
          if (!existing.phone && formattedPhone) updates.phone = formattedPhone
          if (!existing.company && company) updates.company = company
          if (!existing.city && city) updates.city = city
          if (!existing.state && state) updates.state = state

          if (Object.keys(updates).length > 0) {
            await prisma.contact.update({
              where: { id: existing.id },
              data: updates,
            })
            enriched++
          }
        } else {
          // Criar novo contato com todos os campos
          await prisma.contact.create({
            data: {
              organizationId: user.organizationId,
              name: name || 'Sem nome',
              email: email || null,
              phone: formattedPhone || null,
              company: company || null,
              city: city || null,
              state: state || null,
            },
          })
          created++
        }
      } catch (error: any) {
        errors++
        errorDetails.push(`Linha ${rowNum}: ${error.message}`)
      }
    }

    return NextResponse.json({
      created,
      enriched,
      errors,
      total: rows.length,
      errorDetails: errorDetails.slice(0, 10),
    })

  } catch (error: any) {
    logger.error({ err: error }, 'Import error')
    return await apiError(ERR.INTERNAL_ERROR, 500, { req: request })
  }
}
