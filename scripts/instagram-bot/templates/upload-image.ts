import fs from 'fs'
import path from 'path'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const ENDPOINT = process.env.MINIO_TASKS_ENDPOINT!
const ACCESS_KEY = process.env.MINIO_TASKS_ACCESS_KEY!
const SECRET_KEY = process.env.MINIO_TASKS_SECRET_KEY!
const BUCKET = process.env.MINIO_TASKS_BUCKET ?? 'task-attachments'

const s3 = new S3Client({
  endpoint: ENDPOINT,
  region: 'us-east-1', // MinIO ignores this but SDK requires it
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
  forcePathStyle: true, // required for MinIO
})

export async function uploadToStorage(imagePath: string): Promise<string> {
  const filename = `instagram/${Date.now()}-${path.basename(imagePath)}`
  const body = fs.readFileSync(imagePath)

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: filename,
      Body: body,
      ContentType: 'image/jpeg',
    })
  )

  // MinIO public URL format
  return `${ENDPOINT}/${BUCKET}/${filename}`
}
