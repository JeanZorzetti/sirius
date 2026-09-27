import { SignJWT } from 'jose'

/**
 * The same `session` cookie that login() sets (lib/auth.ts): an HS256 JWT signed with SESSION_SECRET. Lets the API
 * specs call session-authenticated routes as a user without going through the login screen.
 */
export async function cookieDeSessao(user: { id: string; email: string; name: string | null; organizationId: string }) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const token = await new SignJWT({ user: { id: user.id, email: user.email, name: user.name, organizationId: user.organizationId }, expires })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(new TextEncoder().encode(process.env.SESSION_SECRET))
  return `session=${token}`
}
