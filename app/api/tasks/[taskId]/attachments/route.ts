import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

const BUCKET = 'task-attachments'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

let s3: S3Client | null = null

function getS3Client(): S3Client {
  if (s3) return s3
  const endpoint = process.env.MINIO_TASKS_ENDPOINT ?? process.env.MINIO_ENDPOINT
  const accessKeyId = process.env.MINIO_TASKS_ACCESS_KEY ?? process.env.MINIO_ACCESS_KEY
  const secretAccessKey = process.env.MINIO_TASKS_SECRET_KEY ?? process.env.MINIO_SECRET_KEY
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('MinIO env vars not configured')
  }
  s3 = new S3Client({
    endpoint,
    region: 'us-east-1',
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })
  return s3
}

// GET /api/tasks/[taskId]/attachments — list with signed URLs
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params
  const session = await getSession()
  if (!session?.user?.email) {
    return await apiError(ERR.UNAUTHORIZED, 401)
  }

  const attachments = await prisma.taskAttachment.findMany({
    where: { taskId },
    include: { uploadedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { uploadedAt: 'desc' },
  })

  const client = getS3Client()
  const withUrls = await Promise.all(
    attachments.map(async (a) => {
      const url = await getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: BUCKET, Key: a.storageKey }),
        { expiresIn: 3600 }
      )
      return { ...a, url }
    })
  )

  return NextResponse.json(withUrls)
}

// POST /api/tasks/[taskId]/attachments — upload file
export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params
  const session = await getSession()
  if (!session?.user?.email) {
    return await apiError(ERR.UNAUTHORIZED, 401)
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return await apiError(ERR.USER_NOT_FOUND, 404)

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) return await apiError(ERR.NOT_FOUND, 404)

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande (máx 50MB)' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop() || 'bin'
  const storageKey = `tasks/${task.organizationId}/${taskId}/${randomUUID()}.${ext}`

  const client = getS3Client()
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: storageKey,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
      Metadata: { 'original-filename': encodeURIComponent(file.name) },
    })
  )

  const attachment = await prisma.taskAttachment.create({
    data: {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/octet-stream',
      storageKey,
      taskId,
      uploadedById: user.id,
    },
    include: { uploadedBy: { select: { id: true, name: true, email: true } } },
  })

  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: BUCKET, Key: storageKey }),
    { expiresIn: 3600 }
  )

  return NextResponse.json({ ...attachment, url }, { status: 201 })
}

// DELETE /api/tasks/[taskId]/attachments?id=xxx
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params
  const session = await getSession()
  if (!session?.user?.email) {
    return await apiError(ERR.UNAUTHORIZED, 401)
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID do anexo obrigatório' }, { status: 400 })

  const attachment = await prisma.taskAttachment.findFirst({ where: { id, taskId } })
  if (!attachment) return await apiError(ERR.NOT_FOUND, 404)

  const client = getS3Client()
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: attachment.storageKey }))
  await prisma.taskAttachment.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
