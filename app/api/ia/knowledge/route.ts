import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { chunkText } from '@/lib/rag/chunker'
import { embedText } from '@/lib/rag/embeddings'

async function getOrgId(request: NextRequest): Promise<string | null> {
  const session = await getSession()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true },
  })
  return user?.organizationId ?? null
}

export async function GET(request: NextRequest) {
  const orgId = await getOrgId(request)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const documents = await prisma.knowledgeDocument.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      contentType: true,
      createdAt: true,
      _count: { select: { chunks: true } },
    },
  })

  return NextResponse.json({ documents })
}

export async function POST(request: NextRequest) {
  const orgId = await getOrgId(request)
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, content, contentType, metadata } = body as {
    title: string
    content: string
    contentType: string
    metadata?: Record<string, unknown>
  }

  if (!title?.trim() || !content?.trim() || !contentType?.trim()) {
    return NextResponse.json({ error: 'title, content and contentType are required' }, { status: 400 })
  }

  // Create document
  const doc = await prisma.knowledgeDocument.create({
    data: { organizationId: orgId, title: title.trim(), content: content.trim(), contentType, metadata: metadata ?? null },
  })

  // Chunk + embed in background — respond immediately
  embedChunks(doc.id, content.trim()).catch(console.error)

  return NextResponse.json({ document: doc }, { status: 201 })
}

async function embedChunks(documentId: string, content: string) {
  const chunks = chunkText(content)

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await embedText(chunks[i])
    const embeddingStr = `[${embedding.join(',')}]`

    // Use $executeRaw to insert with pgvector type
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
  }
}
