import fs from 'fs'
import path from 'path'
import https from 'https'
import http from 'http'

const HF_TOKEN = process.env.HUGGING_FACE_TOKEN
const HF_API_URL = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell'

export type ImageRatio = 'square' | 'portrait' // square=1:1 feed/carousel, portrait=9:16 stories

interface HFResponse {
  error?: string
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function generateImage(
  prompt: string,
  ratio: ImageRatio = 'square',
  outputPath: string
): Promise<string> {
  const width = ratio === 'square' ? 1080 : 608
  const height = ratio === 'square' ? 1080 : 1080

  const enhancedPrompt = `${prompt}, professional photography, clean background, high quality, 4k, brand colors blue and white, minimalist design`

  const body = JSON.stringify({
    inputs: enhancedPrompt,
    parameters: {
      width,
      height,
      num_inference_steps: 4, // FLUX schnell is optimized for 4 steps
      guidance_scale: 0,
    },
  })

  const maxRetries = 3
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const imageBuffer = await fetchImage(body)
      fs.writeFileSync(outputPath, imageBuffer)
      console.log(`[generate-image] Saved to ${outputPath}`)
      return outputPath
    } catch (err: unknown) {
      const error = err as Error & { status?: number }
      if (error.status === 503 && attempt < maxRetries) {
        // Model loading — wait and retry
        console.log(`[generate-image] Model loading, waiting 20s... (attempt ${attempt}/${maxRetries})`)
        await sleep(20000)
        continue
      }
      throw err
    }
  }

  throw new Error('Failed to generate image after max retries')
}

function fetchImage(body: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(HF_API_URL)
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = https.request(options, res => {
      const chunks: Buffer[] = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        const contentType = res.headers['content-type'] || ''

        if (contentType.includes('application/json')) {
          const json: HFResponse = JSON.parse(buffer.toString())
          const err = new Error(json.error || 'HuggingFace API error') as Error & { status?: number }
          err.status = res.statusCode
          reject(err)
        } else {
          resolve(buffer)
        }
      })
      res.on('error', reject)
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

export function getTempImagePath(prefix: string): string {
  const dir = path.join(process.cwd(), 'scripts', 'instagram-bot', '.tmp')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return path.join(dir, `${prefix}-${Date.now()}.jpg`)
}

export function cleanupTempImage(filePath: string) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  } catch {
    // ignore cleanup errors
  }
}
