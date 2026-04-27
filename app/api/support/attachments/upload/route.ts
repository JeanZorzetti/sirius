import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSupportUser } from '@/lib/support-auth'
import { uploadMedia, getMediaUrl } from '@/lib/storage'
import { randomUUID } from 'crypto'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain',
  'application/zip',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  const ctx = await getSupportUser()
  if (ctx instanceof NextResponse) return ctx

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const ticketId = formData.get('ticketId') as string | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const fileId = randomUUID()

  const storageKey = await uploadMedia({
    orgId: ctx.organizationId,
    messageId: fileId,
    buffer,
    mimetype: file.type,
    fileName: file.name,
  })

  const attachment = await prisma.supportAttachment.create({
    data: {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      storageKey,
      uploadedById: ctx.userId,
      ...(ticketId && { ticketId }),
    },
  })

  const signedUrl = await getMediaUrl(storageKey)

  return NextResponse.json({ attachment: { ...attachment, signedUrl } }, { status: 201 })
}
