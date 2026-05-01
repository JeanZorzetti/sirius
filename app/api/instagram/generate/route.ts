import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import https from 'https'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export const runtime = 'nodejs'
export const maxDuration = 120

const OPENAI_KEY = process.env.OPENAI_API_KEY!
const s3 = new S3Client({
  endpoint: process.env.MINIO_TASKS_ENDPOINT!,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_TASKS_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_TASKS_SECRET_KEY!,
  },
  forcePathStyle: true,
})

type PostType = 'feed' | 'carousel' | 'stories'

function nextScheduledTime(type: PostType): Date {
  const slots: Record<PostType, { days: number[]; hour: number; minute: number }> = {
    stories:  { days: [1, 2, 3, 4, 5], hour: 8,  minute: 30 },
    feed:     { days: [2, 3, 4],       hour: 9,  minute: 0  },
    carousel: { days: [2, 3, 4],       hour: 12, minute: 30 },
  }
  const slot = slots[type]
  const candidate = new Date()
  candidate.setUTCHours(slot.hour + 3, slot.minute, 0, 0)
  let attempts = 0
  while (attempts < 14 && (candidate <= new Date() || !slot.days.includes(candidate.getDay()))) {
    candidate.setDate(candidate.getDate() + 1)
    candidate.setUTCHours(slot.hour + 3, slot.minute, 0, 0)
    attempts++
  }
  return candidate
}

async function generateImageBase64(prompt: string, size: string): Promise<string> {
  const body = JSON.stringify({
    model: 'gpt-image-2',
    prompt: `${prompt}, professional photography, high quality, blue and white brand colors, minimalist modern design`,
    n: 1,
    size,
    quality: 'medium',
    output_format: 'jpeg',
  })

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }
    const req = https.request(options, res => {
      const chunks: Buffer[] = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const json = JSON.parse(Buffer.concat(chunks).toString())
        if (json.error) { reject(new Error(json.error.message)); return }
        resolve(json.data[0].b64_json)
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function uploadToMinio(b64: string, filename: string): Promise<string> {
  const buffer = Buffer.from(b64, 'base64')
  const key = `instagram/${filename}`
  await s3.send(new PutObjectCommand({
    Bucket: 'task-attachments',
    Key: key,
    Body: buffer,
    ContentType: 'image/jpeg',

  }))
  return `${process.env.MINIO_TASKS_ENDPOINT}/task-attachments/${key}`
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, caption, hashtags, altText, imagePrompt, slides } = await request.json()

  if (!type || !caption || !imagePrompt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const size = type === 'stories' ? '1024x1792' : '1024x1024'
  const imageUrls: string[] = []

  if (type === 'carousel' && slides?.length) {
    for (let i = 0; i < slides.length; i++) {
      const slidePrompt = i === 0 ? imagePrompt : `${imagePrompt}, text: "${slides[i]}"`
      const b64 = await generateImageBase64(slidePrompt, '1024x1024')
      const url = await uploadToMinio(b64, `${Date.now()}-carousel-${i}.jpg`)
      imageUrls.push(url)
    }
  } else {
    const b64 = await generateImageBase64(imagePrompt, size)
    const url = await uploadToMinio(b64, `${Date.now()}-${type}.jpg`)
    imageUrls.push(url)
  }

  const organizationId = session.user.organizationId
  const scheduledFor = nextScheduledTime(type as PostType)
  const post = await prisma.instagramPost.create({
    data: {
      organizationId,
      type,
      caption,
      hashtags,
      altText: altText || '',
      imageUrls,
      slides: slides || [],
      scheduledFor,
      status: 'pending',
    },
  })

  return NextResponse.json(post)
}
