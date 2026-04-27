import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

const BUCKET = 'task-attachments'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

function getS3Client(): S3Client {
  const endpoint = process.env.MINIO_ENDPOINT
  const accessKeyId = process.env.MINIO_ACCESS_KEY
  const secretAccessKey = process.env.MINIO_SECRET_KEY
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('MinIO env vars not configured')
  }
  return new S3Client({
    endpoint,
    region: 'us-east-1',
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })
}

async function ensureBucket(s3: S3Client) {
  const { HeadBucketCommand, CreateBucketCommand } = await import('@aws-sdk/client-s3')
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }))
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }))
  }
}

// GET /api/tasks/[taskId]/attachments — list with signed URLs
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params
  const session = await getSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const attachments = await prisma.taskAttachment.findMany({
    where: { taskId },
    include: { uploadedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { uploadedAt: 'desc' },
  })

  const s3 = getS3Client()
  const withUrls = await Promise.all(
    attachments.map(async (a: typeof attachments[number]) => {
      const url = await getSignedUrl(
        s3,
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
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande (máx 50MB)' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop() || 'bin'
  const storageKey = `tasks/${task.organizationId}/${taskId}/${randomUUID()}.${ext}`

  const s3 = getS3Client()
  await ensureBucket(s3)
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: storageKey,
      Body: buffer,
      ContentType: file.type,
      Metadata: { 'original-filename': file.name },
    })
  )

  const attachment = await prisma.taskAttachment.create({
    data: {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      storageKey,
      taskId,
      uploadedById: user.id,
    },
    include: { uploadedBy: { select: { id: true, name: true, email: true } } },
  })

  const url = await getSignedUrl(
    s3,
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
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID do anexo obrigatório' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const attachment = await prisma.taskAttachment.findFirst({
    where: { id, taskId },
  })
  if (!attachment) return NextResponse.json({ error: 'Anexo não encontrado' }, { status: 404 })

  const s3 = getS3Client()
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: attachment.storageKey }))
  await prisma.taskAttachment.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
