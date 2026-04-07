/**
 * MinIO/S3 Storage Client
 *
 * Provides persistent media storage for WhatsApp messages.
 * Uses MinIO (S3-compatible) hosted on EasyPanel.
 *
 * Bucket structure:
 *   whatsapp-media/
 *     {orgId}/{contactId}/{messageId}.{ext}
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const BUCKET = 'whatsapp-media'

let client: S3Client | null = null

function getClient(): S3Client {
  if (client) return client

  const endpoint = process.env.MINIO_ENDPOINT
  const accessKey = process.env.MINIO_ACCESS_KEY
  const secretKey = process.env.MINIO_SECRET_KEY

  if (!endpoint || !accessKey || !secretKey) {
    throw new Error('MinIO env vars not set (MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY)')
  }

  client = new S3Client({
    endpoint,
    region: 'us-east-1', // MinIO ignores this but SDK requires it
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle: true, // Required for MinIO
  })

  return client
}

async function ensureBucket() {
  const s3 = getClient()
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }))
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }))
  }
}

// Infer extension from mimetype
function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/3gpp': '3gp',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'm4a',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'text/plain': 'txt',
  }
  return map[mime] || 'bin'
}

/**
 * Upload media to MinIO.
 * Returns the object key (path) for later retrieval.
 */
export async function uploadMedia({
  orgId,
  contactId,
  messageId,
  buffer,
  mimetype,
  fileName,
}: {
  orgId: string
  contactId?: string | null
  messageId: string
  buffer: Buffer
  mimetype: string
  fileName?: string | null
}): Promise<string> {
  await ensureBucket()

  const ext = fileName?.split('.').pop() || extFromMime(mimetype)
  const contactFolder = contactId || '_unknown'
  const key = `${orgId}/${contactFolder}/${messageId}.${ext}`

  await getClient().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      Metadata: {
        'original-filename': fileName || '',
      },
    })
  )

  return key
}

/**
 * Upload base64 data to MinIO.
 * Accepts data URI (data:image/jpeg;base64,...) or raw base64.
 */
export async function uploadBase64({
  orgId,
  contactId,
  messageId,
  base64Data,
  mimetype,
  fileName,
}: {
  orgId: string
  contactId?: string | null
  messageId: string
  base64Data: string
  mimetype?: string
  fileName?: string | null
}): Promise<string> {
  let raw = base64Data
  let detectedMime = mimetype || 'application/octet-stream'

  // Parse data URI
  if (base64Data.startsWith('data:')) {
    const match = base64Data.match(/^data:([^;]+);base64,(.+)$/)
    if (match) {
      detectedMime = match[1]
      raw = match[2]
    }
  }

  const buffer = Buffer.from(raw, 'base64')
  return uploadMedia({ orgId, contactId, messageId, buffer, mimetype: detectedMime, fileName })
}

/**
 * Get a pre-signed URL for reading media (expires in 1h).
 */
export async function getMediaUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  return getSignedUrl(getClient(), command, { expiresIn: 3600 })
}

/**
 * Download media as Buffer.
 */
export async function downloadMedia(key: string): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await getClient().send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key })
  )
  const bytes = await response.Body!.transformToByteArray()
  return {
    buffer: Buffer.from(bytes),
    contentType: response.ContentType || 'application/octet-stream',
  }
}

/**
 * Check if a key looks like a MinIO key (not base64 or URL).
 */
export function isMinioKey(value: string): boolean {
  // MinIO keys look like: orgId/contactId/messageId.ext
  return /^[a-f0-9-]+\/[a-f0-9_-]+\/[a-zA-Z0-9_-]+\.\w+$/.test(value)
}
