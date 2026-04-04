import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'
import { prismaWa } from '@/lib/prisma-wa'
import { uuidSchema } from '@/lib/api-validators'
import logger from '@/lib/logger'
import { whatsmeowClient } from '@/lib/integrations/whatsmeow-client'

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
      const connection = await prismaWa.whatsAppConnection.findFirst({
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

      const normalizedPhone = phone.replace(/\D/g, '')
      const remoteJid = `${normalizedPhone}@s.whatsapp.net`

      // Send via Whatsmeow Gateway
      const res = await whatsmeowClient.sendText(connection.instanceName, normalizedPhone, message)
      const messageId = res.messageId

      // Store message in DB
      await prismaWa.whatsAppMessage.create({
        data: {
          remoteJid,
          text: message,
          direction: 'OUTBOUND',
          status: 'SENT',
          organizationId: context.organizationId,
          connectionId: connection.id,
          messageId: messageId || undefined
        }
      })

      logger.info({
        requestId: context.requestId,
        organizationId: context.organizationId,
        connectionId,
        phone: normalizedPhone,
        provider: 'whatsmeow',
      }, 'WhatsApp message sent via API')

      return NextResponse.json(
        apiResponse(context.requestId, {
          sent: true,
          phone: normalizedPhone,
          connectionId,
          messageId,
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
