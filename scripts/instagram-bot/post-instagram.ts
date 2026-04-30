import fs from 'fs'
import FormData from 'form-data'
import https from 'https'

const IG_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN
const GRAPH_API = 'https://graph.facebook.com/v21.0'

export type PostType = 'feed' | 'carousel' | 'stories'

// Upload image to Facebook CDN (required before posting)
async function uploadImageToFacebook(imagePath: string): Promise<string> {
  const form = new FormData()
  form.append('source', fs.createReadStream(imagePath))
  form.append('published', 'false')
  form.append('access_token', ACCESS_TOKEN!)

  return new Promise((resolve, reject) => {
    const req = https.request(
      `${GRAPH_API}/${IG_ACCOUNT_ID}/media`,
      { method: 'POST', headers: form.getHeaders() },
      res => {
        let data = ''
        res.on('data', chunk => (data += chunk))
        res.on('end', () => {
          const json = JSON.parse(data)
          if (json.error) reject(new Error(json.error.message))
          else resolve(json.id)
        })
      }
    )
    req.on('error', reject)
    form.pipe(req)
  })
}

// Create media container via URL (for feed/stories)
async function createMediaContainer(params: Record<string, string>): Promise<string> {
  const searchParams = new URLSearchParams({
    ...params,
    access_token: ACCESS_TOKEN!,
  })

  return graphPost(`/${IG_ACCOUNT_ID}/media`, searchParams)
}

// Publish a container
async function publishContainer(containerId: string): Promise<string> {
  const searchParams = new URLSearchParams({
    creation_id: containerId,
    access_token: ACCESS_TOKEN!,
  })

  return graphPost(`/${IG_ACCOUNT_ID}/media_publish`, searchParams)
}

function graphPost(endpoint: string, params: URLSearchParams): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = params.toString()
    const options = {
      hostname: 'graph.facebook.com',
      path: `/v21.0${endpoint}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = https.request(options, res => {
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => {
        const json = JSON.parse(data)
        if (json.error) reject(new Error(`Meta API: ${json.error.message}`))
        else resolve(json.id)
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// Wait for container to be ready (async processing)
async function waitForContainer(containerId: string, maxWait = 60000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    const status = await getContainerStatus(containerId)
    if (status === 'FINISHED') return
    if (status === 'ERROR') throw new Error(`Container ${containerId} processing failed`)
    await new Promise(r => setTimeout(r, 3000))
  }
  throw new Error('Container processing timeout')
}

function getContainerStatus(containerId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({ fields: 'status_code', access_token: ACCESS_TOKEN! })
    https
      .get(`${GRAPH_API}/${containerId}?${params}`, res => {
        let data = ''
        res.on('data', chunk => (data += chunk))
        res.on('end', () => {
          const json = JSON.parse(data)
          if (json.error) reject(new Error(json.error.message))
          else resolve(json.status_code)
        })
      })
      .on('error', reject)
  })
}

export async function postFeed(imageUrl: string, caption: string, altText?: string): Promise<string> {
  console.log('[post-instagram] Creating feed container...')
  const containerId = await createMediaContainer({
    image_url: imageUrl,
    caption,
    alt_text: altText || '',
  })

  await waitForContainer(containerId)
  const postId = await publishContainer(containerId)
  console.log(`[post-instagram] Feed posted: ${postId}`)
  return postId
}

export async function postStories(imageUrl: string): Promise<string> {
  console.log('[post-instagram] Creating stories container...')
  const containerId = await createMediaContainer({
    image_url: imageUrl,
    media_type: 'IMAGE',
    // Stories are detected by aspect ratio (9:16)
  })

  await waitForContainer(containerId)
  const postId = await publishContainer(containerId)
  console.log(`[post-instagram] Stories posted: ${postId}`)
  return postId
}

export async function postCarousel(
  imageUrls: string[],
  caption: string,
  altText?: string
): Promise<string> {
  console.log('[post-instagram] Creating carousel children...')

  // Create child containers for each slide
  const childIds = await Promise.all(
    imageUrls.map(url =>
      createMediaContainer({
        image_url: url,
        is_carousel_item: 'true',
      })
    )
  )

  // Wait for all children to be ready
  await Promise.all(childIds.map(id => waitForContainer(id)))

  // Create carousel container
  console.log('[post-instagram] Creating carousel container...')
  const carouselId = await createMediaContainer({
    media_type: 'CAROUSEL',
    children: childIds.join(','),
    caption,
    alt_text: altText || '',
  })

  await waitForContainer(carouselId)
  const postId = await publishContainer(carouselId)
  console.log(`[post-instagram] Carousel posted: ${postId}`)
  return postId
}
