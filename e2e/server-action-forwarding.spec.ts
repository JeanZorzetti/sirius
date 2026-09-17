import { test, expect } from '@playwright/test'
import { existsSync, readFileSync } from 'node:fs'

// Regression for the 2026-09-16 outage: Next 16.1.1 forwards a Server Action to
// the route *pattern* of the page that owns it ("/[locale]/dashboard"), that URL
// 404s and the 404 forwards again — forever, with no login needed. The request
// below hung for 300s while the server pinned the CPU. Next 16.3.x stops
// re-forwarding requests that carry `x-action-forwarded`.
const MANIFEST = '.next/server/server-reference-manifest.json'
const HOME_WORKER = 'app/[locale]/(marketing)/page'

test('a Server Action posted to a page that does not own it answers fast', async ({ request }) => {
  test.skip(!existsSync(MANIFEST), 'needs a production build (next build)')

  const actions: Record<string, { workers: Record<string, unknown> }> =
    JSON.parse(readFileSync(MANIFEST, 'utf8')).node
  const actionId = Object.keys(actions).find((id) => !(HOME_WORKER in actions[id].workers))
  expect(actionId, 'an action the home page does not own').toBeTruthy()

  // Throws "Timeout 15000ms exceeded" while the forwarding loop is alive.
  const res = await request.post('/', {
    headers: { 'Next-Action': actionId!, 'Content-Type': 'text/plain;charset=UTF-8' },
    data: '[]',
    timeout: 15_000,
  })
  expect(res.status()).toBeLessThan(500)
})
