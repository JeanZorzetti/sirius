import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export const runtime = 'nodejs'

const s3 = new S3Client({
  endpoint: process.env.MINIO_TASKS_ENDPOINT!,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_TASKS_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_TASKS_SECRET_KEY!,
  },
  forcePathStyle: true,
})

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const key = `instagram/${Date.now()}-upload.${ext}`

  await s3.send(new PutObjectCommand({
    Bucket: 'task-attachments',
    Key: key,
    Body: buffer,
    ContentType: file.type,
  }))

  const url = `${process.env.MINIO_TASKS_ENDPOINT}/task-attachments/${key}`
  return NextResponse.json({ url })
}
