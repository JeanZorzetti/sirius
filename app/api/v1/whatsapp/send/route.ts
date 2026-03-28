import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { uuidSchema } from '@/lib/api-validators'
import logger from '@/lib/logger'
import { EvolutionClient } from '@/lib/integrations/evolution-client'

/**
 * POST /api/v1/whatsapp/send
 * Send a WhatsApp message via a specific connection.
 * Used by Sofia IA agents to send autonomous messages.
 */
export async function POST(request: NextRequest) {
  return withApiMiddleware(request, async (req, context) => {
    try {
      const body = await req.json()
      const { connectionId, phone, message } = body

      if (!connectionId || !phone || !message) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'VALIDATION_ERROR',
            message: 'connectionId, phone, and message are required'
          }),
          { status: 400 }
        )
      }

      const connValidation = uuidSchema.safeParse(connectionId)
      if (!connValidation.success) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'VALIDATION_ERROR',
            message: 'Invalid connectionId format'
          }),
          { status: 400 }
        )
      }

      // Verify connection exists and is connected
      const connection = await prisma.whatsAppConnection.findFirst({
        where: {
          id: connectionId,
          organizationId: context.organizationId
        }
      })

      if (!connection) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'NOT_FOUND',
            message: 'WhatsApp connection not found'
          }),
          { status: 404 }
        )
      }

      if (connection.status !== 'CONNECTED') {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'PRECONDITION_FAILED',
            message: `WhatsApp connection is ${connection.status}. Must be CONNECTED to send messages.`
          }),
          { status: 412 }
        )
      }

      // Get Evolution API config from organization
      const org = await prisma.organization.findUnique({
        where: { id: context.organizationId },
        select: { evolutionBaseUrl: true, evolutionApiKey: true }
      })

      if (!org?.evolutionBaseUrl || !org?.evolutionApiKey) {
        return NextResponse.json(
          apiResponse(context.requestId, undefined, {
            code: 'PRECONDITION_FAILED',
            message: 'Evolution API not configured for this organization'
          }),
          { status: 412 }
        )
      }

      // Send message via Evolution API
      const client = new EvolutionClient(
        org.evolutionBaseUrl,
        org.evolutionApiKey,
        connection.instanceName
      )

      const normalizedPhone = phone.replace(/\D/g, '')
      const remoteJid = `${normalizedPhone}@s.whatsapp.net`

      const result = await client.sendTextMessage(remoteJid, message)

      // Store message in DB
      await prisma.whatsAppMessage.create({
        data: {
          remoteJid,
          text: message,
          direction: 'OUTBOUND',
          status: 'SENT',
          organizationId: context.organizationId,
          connectionId: connection.id,
          messageId: result?.key?.id || undefined
        }
      })

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        connectionId,
        phone: normalizedPhone
      }, 'WhatsApp message sent via API')

      return NextResponse.json(
        apiResponse(context.requestId, {
          sent: true,
          phone: normalizedPhone,
          connectionId,
          messageId: result?.key?.id || null
        }),
        { status: 200 }
      )
    } catch (error) {
      logger.error({
        requestId: context.requestId,
        organizationId: context.organizationId,
        error
      }, 'Error sending WhatsApp message via API')

      return NextResponse.json(
        apiResponse(context.requestId, undefined, {
          code: 'INTERNAL_ERROR',
          message: 'Failed to send WhatsApp message'
        }),
        { status: 500 }
      )
    }
  })
}
