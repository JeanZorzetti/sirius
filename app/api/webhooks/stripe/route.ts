import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { PrismaClient } from "@prisma/client";
import { dispatchWebhookAsync } from "@/lib/webhooks/dispatcher";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/events";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
        return new NextResponse("No signature provided", { status: 400 });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error('[STRIPE WEBHOOK] Signature verification failed:', error.message);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as any;

    if (event.type === "checkout.session.completed") {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

        if (!session?.metadata?.organizationId) {
            return new NextResponse("Org ID missing in metadata", { status: 400 });
        }

        const org = await prisma.organization.update({
            where: {
                id: session.metadata.organizationId
            },
            data: {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                plan: 'PRO'
            }
        })
        console.log(`[STRIPE] Organization ${session.metadata.organizationId} upgraded to PRO.`);

        // Dispatch webhook (async, non-blocking)
        dispatchWebhookAsync(org.id, WEBHOOK_EVENTS.ORGANIZATION_UPGRADED, {
            organization: {
                id: org.id,
                name: org.name,
                plan: 'PRO'
            },
            subscription: {
                id: subscription.id,
                status: subscription.status
            }
        });
    }

    return new NextResponse(null, { status: 200 });
}
