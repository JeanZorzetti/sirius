import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { chunkText } from '@/lib/rag/chunker'
import { embedText } from '@/lib/rag/embeddings'

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB

async function getOrgId(): Promise<string | null> {
  const session = await getSession()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true },
  })
  return user?.organizationId ?? null
}

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const name = file.name.toLowerCase()

  if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseModule = await import('pdf-parse') as any
    const pdfParse = pdfParseModule.default ?? pdfParseModule
    const data = await pdfParse(buffer)
    return data.text
  }

  if (name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  // Plain text / markdown / CSV
  return buffer.toString('utf-8')
}

export async function GET() {
  const orgId = await getOrgId()
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const documents = await prisma.knowledgeDocument.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      contentType: true,
      agentIds: true,
      createdAt: true,
      _count: { select: { chunks: true } },
    },
  })

  return NextResponse.json({ documents })
}

export async function POST(request: NextRequest) {
  const orgId = await getOrgId()
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let title: string
  let content: string
  let contentType: string
  let agentIds: string[]
  let metadata: Record<string, unknown> | null = null

  const ct = request.headers.get('content-type') || ''

  if (ct.includes('multipart/form-data')) {
    const formData = await request.formData()
    title = (formData.get('title') as string | null)?.trim() ?? ''
    contentType = (formData.get('contentType') as string | null) ?? 'custom'
    const rawAgentIds = formData.get('agentIds') as string | null
    agentIds = rawAgentIds ? JSON.parse(rawAgentIds) : []

    const file = formData.get('file') as File | null
    const textContent = (formData.get('content') as string | null)?.trim() ?? ''

    if (file) {
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 })
      }
      content = await extractTextFromFile(file)
      metadata = { originalFileName: file.name, fileSize: file.size, extractedFrom: 'file' }
    } else if (textContent) {
      content = textContent
    } else {
      return NextResponse.json({ error: 'Either file or content is required' }, { status: 400 })
    }
  } else {
    // JSON body (legacy)
    const body = await request.json()
    title = body.title?.trim() ?? ''
    content = body.content?.trim() ?? ''
    contentType = body.contentType ?? 'custom'
    agentIds = body.agentIds ?? []
    metadata = body.metadata ?? null
  }

  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
  }

  const doc = await prisma.knowledgeDocument.create({
    data: {
      organizationId: orgId,
      title,
      content,
      contentType,
      agentIds,
      metadata: metadata as any,
    },
  })

  // Embed chunks asynchronously — respond immediately
  embedChunks(doc.id, content).catch(console.error)

  return NextResponse.json({ document: { ...doc, _count: { chunks: 0 } } }, { status: 201 })
}

async function embedChunks(documentId: string, content: string) {
  const chunks = chunkText(content)

  for (let i = 0; i < chunks.length; i++) {
    try {
      const embedding = await embedText(chunks[i])
      const embeddingStr = `[${embedding.join(',')}]`

      await prisma.$executeRaw`
        INSERT INTO "KnowledgeChunk" ("id", "documentId", "chunkIndex", "text", "embedding", "createdAt")
        VALUES (
          gen_random_uuid()::text,
          ${documentId},
          ${i},
          ${chunks[i]},
          ${embeddingStr}::vector,
          NOW()
        )
      `
    } catch (err) {
      console.error(`[RAG] Failed to embed chunk ${i} for doc ${documentId}:`, err)
    }
  }
}
