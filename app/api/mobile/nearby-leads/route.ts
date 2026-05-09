/**
 * GET /api/mobile/nearby-leads?lat=...&lng=...&radius=5000
 *
 * Retorna contatos da organização do usuário que têm coordenadas cadastradas
 * e estão dentro do raio (em metros) do ponto GPS informado.
 *
 * Fórmula de Haversine executada via PostgreSQL para eficiência.
 * Máximo de 50 resultados, ordenados por distância.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user?.email) {
    return await apiError(ERR.UNAUTHORIZED, 401, { req: request })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true },
  })
  if (!user?.organizationId) {
    return await apiError(ERR.USER_NO_ORG, 403, { req: request })
  }

  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')
  const radiusMeters = Math.min(parseInt(searchParams.get('radius') ?? '5000', 10), 50_000)

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat e lng são obrigatórios' }, { status: 400 })
  }

  // Haversine via SQL — eficiente sem extensão PostGIS
  // Fórmula: 6371000 * acos(cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lng2 - lng1)) + sin(radians(lat1)) * sin(radians(lat2)))
  const leads = await prisma.$queryRaw<
    Array<{
      id: string
      name: string
      company: string | null
      phone: string | null
      latitude: number
      longitude: number
      distance_meters: number
      last_deal_title: string | null
    }>
  >`
    SELECT
      c.id,
      c.name,
      c.company,
      c.phone,
      c.latitude,
      c.longitude,
      (6371000 * acos(
        LEAST(1.0, cos(radians(${lat})) * cos(radians(c.latitude))
          * cos(radians(c.longitude) - radians(${lng}))
          + sin(radians(${lat})) * sin(radians(c.latitude))
        )
      )) AS distance_meters,
      (
        SELECT d.title FROM "Deal" d
        WHERE d."contactId" = c.id
        ORDER BY d."createdAt" DESC
        LIMIT 1
      ) AS last_deal_title
    FROM "Contact" c
    WHERE
      c."organizationId" = ${user.organizationId}
      AND c.latitude IS NOT NULL
      AND c.longitude IS NOT NULL
      AND (6371000 * acos(
        LEAST(1.0, cos(radians(${lat})) * cos(radians(c.latitude))
          * cos(radians(c.longitude) - radians(${lng}))
          + sin(radians(${lat})) * sin(radians(c.latitude))
        )
      )) <= ${radiusMeters}
    ORDER BY distance_meters ASC
    LIMIT 50
  `

  return NextResponse.json({
    leads: leads.map((l) => ({
      id: l.id,
      name: l.name,
      company: l.company,
      phone: l.phone,
      latitude: l.latitude,
      longitude: l.longitude,
      distanceMeters: Math.round(Number(l.distance_meters)),
      lastDealTitle: l.last_deal_title,
    })),
  })
}
