import fs from 'fs'
import path from 'path'
import https from 'https'

export type ImageRatio = 'square' | 'portrait' // square=1:1 feed/carousel, portrait=9:16 stories

// Pollinations.ai — free, no API key, no rate limits for reasonable usage
const POLLINATIONS_URL = 'https://image.pollinations.ai/prompt'

export async function generateImage(
  prompt: string,
  ratio: ImageRatio = 'square',
  outputPath: string
): Promise<string> {
  const width = ratio === 'square' ? 1080 : 608
  const height = ratio === 'square' ? 1080 : 1080

  const enhancedPrompt = `${prompt}, professional photography, high quality, 4k, blue and white brand colors, minimalist design`
  const encodedPrompt = encodeURIComponent(enhancedPrompt)
  const url = `${POLLINATIONS_URL}/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${Date.now()}`

  const imageBuffer = await fetchWithRedirects(url)

  // Validate JPEG magic bytes (FF D8 FF)
  if (imageBuffer[0] !== 0xff || imageBuffer[1] !== 0xd8 || imageBuffer[2] !== 0xff) {
    throw new Error(`Invalid image from Pollinations (got: ${imageBuffer.slice(0, 20).toString('hex')})`)
  }

  fs.writeFileSync(outputPath, imageBuffer)
  console.log(`[generate-image] Saved to ${outputPath}`)
  return outputPath
}

function fetchWithRedirects(url: string, redirects = 5): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'SiriusCRM-Bot/1.0' } }, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (redirects === 0) { reject(new Error('Too many redirects')); return }
        fetchWithRedirects(res.headers.location, redirects - 1).then(resolve).catch(reject)
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Pollinations returned status ${res.statusCode}`))
        return
      }
      const chunks: Buffer[] = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
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
