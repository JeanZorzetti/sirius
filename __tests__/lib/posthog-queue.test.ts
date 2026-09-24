import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPostHog, flushQueue } from '@/lib/posthog'

// The SDK loads after mount; events fired on mount (landing $pageview, sign_up) must survive until it does
describe('posthog queue', () => {
  beforeEach(() => {
    delete (window as any).posthog
    delete (window as any).__phQueue
  })

  it('replays calls made before the SDK loaded, in order', () => {
    getPostHog().capture('$pageview', { $current_url: 'https://x/blog' })
    getPostHog().identify('u1', { plan: 'PRO' })
    getPostHog().capture('sign_up', { method: 'email' })

    const ph = { capture: vi.fn(), identify: vi.fn() }
    ;(window as any).posthog = ph
    flushQueue(ph)

    expect(ph.capture.mock.calls).toEqual([
      ['$pageview', { $current_url: 'https://x/blog' }],
      ['sign_up', { method: 'email' }],
    ])
    expect(ph.identify).toHaveBeenCalledWith('u1', { plan: 'PRO' })
    expect((window as any).__phQueue).toBeUndefined()
  })

  it('goes straight to the SDK once it is loaded', () => {
    const ph = { capture: vi.fn() }
    ;(window as any).posthog = ph
    getPostHog().capture('login')
    expect(ph.capture).toHaveBeenCalledWith('login')
    expect((window as any).__phQueue).toBeUndefined()
  })
})
