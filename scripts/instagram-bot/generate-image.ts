import fs from 'fs'
import path from 'path'
import https from 'https'

export type ImageRatio = 'square' | 'portrait'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!

export async function generateImage(
  prompt: string,
  ratio: ImageRatio = 'square',
  outputPath: string
): Promise<string> {
  const size = ratio === 'square' ? '1024x1024' : '1024x1792'

  const enhancedPrompt = `${prompt}, professional photography, high quality, 4k, blue and white brand colors, minimalist modern design, no text overlays`

  const body = JSON.stringify({
    model: 'gpt-image-2',
    prompt: enhancedPrompt,
    n: 1,
    size,
    quality: 'medium',
    output_format: 'jpeg',
  })

  const imageB64 = await fetchImage(body)
  const buffer = Buffer.from(imageB64, 'base64')
  fs.writeFileSync(outputPath, buffer)
  console.log(`[generate-image] Saved to ${outputPath}`)
  return outputPath
}

function fetchImage(body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = https.request(options, res => {
      const chunks: Buffer[] = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => {
        const json = JSON.parse(Buffer.concat(chunks).toString())
        if (json.error) {
          reject(new Error(`OpenAI: ${json.error.message}`))
          return
        }
        resolve(json.data[0].b64_json)
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
    // ignore
  }
}
