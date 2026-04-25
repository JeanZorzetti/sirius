/**
 * IndexNow API Integration
 * Instantly notify search engines about content updates
 *
 * Supported engines: Bing, Yandex, Seznam.cz, Naver
 * Documentation: https://www.indexnow.org/documentation
 */

const INDEXNOW_API_KEY = 'a573338e-b64d-4494-89f5-aeac5c0e787e'
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://siriuscrm.com.br'

export interface IndexNowSubmission {
  url: string | string[]
  success: boolean
  error?: string
  statusCode?: number
}

/**
 * Submit a single URL to IndexNow
 */
export async function submitUrlToIndexNow(url: string): Promise<IndexNowSubmission> {
  try {
    // Ensure URL is absolute
    const absoluteUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

    const payload = {
      host: new URL(BASE_URL).hostname,
      key: INDEXNOW_API_KEY,
      keyLocation: `${BASE_URL}/${INDEXNOW_API_KEY}.txt`,
      urlList: [absoluteUrl],
    }

    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    })

    if (response.ok || response.status === 202) {
      return {
        url: absoluteUrl,
        success: true,
        statusCode: response.status,
      }
    }

    return {
      url: absoluteUrl,
      success: false,
      error: `HTTP ${response.status}: ${response.statusText}`,
      statusCode: response.status,
    }
  } catch (error) {
    return {
      url,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Submit multiple URLs to IndexNow (batch)
 * Maximum 10,000 URLs per request
 */
export async function submitUrlsToIndexNow(urls: string[]): Promise<IndexNowSubmission> {
  try {
    if (urls.length === 0) {
      return {
        url: [],
        success: false,
        error: 'No URLs provided',
      }
    }

    if (urls.length > 10000) {
      return {
        url: urls,
        success: false,
        error: 'Maximum 10,000 URLs per request',
      }
    }

    // Ensure all URLs are absolute
    const absoluteUrls = urls.map((url) =>
      url.startsWith('http') ? url : `${BASE_URL}${url}`
    )

    const payload = {
      host: new URL(BASE_URL).hostname,
      key: INDEXNOW_API_KEY,
      keyLocation: `${BASE_URL}/${INDEXNOW_API_KEY}.txt`,
      urlList: absoluteUrls,
    }

    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    })

    if (response.ok || response.status === 202) {
      return {
        url: absoluteUrls,
        success: true,
        statusCode: response.status,
      }
    }

    return {
      url: absoluteUrls,
      success: false,
      error: `HTTP ${response.status}: ${response.statusText}`,
      statusCode: response.status,
    }
  } catch (error) {
    return {
      url: urls,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Submit a blog post URL to IndexNow
 */
export async function submitBlogPost(slug: string): Promise<IndexNowSubmission> {
  const url = `/blog/${slug}`
  return submitUrlToIndexNow(url)
}

/**
 * Submit all blog posts to IndexNow
 */
export async function submitAllBlogPosts(slugs: string[]): Promise<IndexNowSubmission> {
  const urls = slugs.map((slug) => `/blog/${slug}`)
  return submitUrlsToIndexNow(urls)
}

/**
 * Verify IndexNow key is accessible
 */
export async function verifyIndexNowKey(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/${INDEXNOW_API_KEY}.txt`)
    const text = await response.text()
    return text.trim() === INDEXNOW_API_KEY
  } catch {
    return false
  }
}

/**
 * Get IndexNow API key for verification
 */
export function getIndexNowKey(): string {
  return INDEXNOW_API_KEY
}

/**
 * Get IndexNow key location URL
 */
export function getIndexNowKeyLocation(): string {
  return `${BASE_URL}/${INDEXNOW_API_KEY}.txt`
}
