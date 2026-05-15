import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

interface LinkPreview {
  url: string
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
}

interface CacheEntry {
  data: LinkPreview
  expiresAt: number
}

const TTL_MS = 60 * 60 * 1000 // 1 hour
const cache = new Map<string, CacheEntry>()
const MAX_CACHE_SIZE = 500

function setCache(url: string, data: LinkPreview) {
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value
    if (firstKey) cache.delete(firstKey)
  }
  cache.set(url, { data, expiresAt: Date.now() + TTL_MS })
}

function getCache(url: string): LinkPreview | null {
  const entry = cache.get(url)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    cache.delete(url)
    return null
  }
  return entry.data
}

function extractMeta(html: string, prop: string): string | null {
  const regexes = [
    new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
  ]
  for (const re of regexes) {
    const m = html.match(re)
    if (m?.[1]) return decodeEntities(m[1].trim())
  }
  return null
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return m?.[1] ? decodeEntities(m[1].trim()) : null
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function isValidHttpUrl(input: string): boolean {
  try {
    const u = new URL(input)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function isPrivateHost(host: string): boolean {
  // Block SSRF: localhost, RFC1918 ranges
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true
  if (host.startsWith('10.') || host.startsWith('192.168.')) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true
  if (host.endsWith('.local') || host.endsWith('.internal')) return true
  return false
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = request.nextUrl.searchParams.get('url')
  if (!url || !isValidHttpUrl(url)) {
    return new NextResponse(null, { status: 204 })
  }

  const parsed = new URL(url)
  if (isPrivateHost(parsed.hostname)) {
    return new NextResponse(null, { status: 204 })
  }

  const cached = getCache(url)
  if (cached) return NextResponse.json(cached)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SiriusBot/1.0; +https://siriuscrm.com.br)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    })
    clearTimeout(timeout)

    const contentType = res.headers.get('content-type') || ''
    if (!res.ok || !contentType.includes('text/html')) {
      return new NextResponse(null, { status: 204 })
    }

    // Cap response size to ~1 MB
    const reader = res.body?.getReader()
    if (!reader) return new NextResponse(null, { status: 204 })

    const decoder = new TextDecoder('utf-8')
    let html = ''
    let total = 0
    const MAX_BYTES = 1024 * 1024
    while (total < MAX_BYTES) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      html += decoder.decode(value, { stream: true })
      // Short-circuit once <head> is closed
      if (html.includes('</head>')) break
    }
    try { await reader.cancel() } catch {}

    const preview: LinkPreview = {
      url,
      title: extractMeta(html, 'og:title') || extractTitle(html),
      description: extractMeta(html, 'og:description') || extractMeta(html, 'description'),
      image: extractMeta(html, 'og:image') || extractMeta(html, 'twitter:image'),
      siteName: extractMeta(html, 'og:site_name') || parsed.hostname,
    }

    // Resolve relative og:image to absolute
    if (preview.image && !preview.image.startsWith('http')) {
      try {
        preview.image = new URL(preview.image, url).toString()
      } catch {
        preview.image = null
      }
    }

    if (!preview.title && !preview.description && !preview.image) {
      return new NextResponse(null, { status: 204 })
    }

    setCache(url, preview)
    return NextResponse.json(preview)
  } catch {
    clearTimeout(timeout)
    return new NextResponse(null, { status: 204 })
  }
}
