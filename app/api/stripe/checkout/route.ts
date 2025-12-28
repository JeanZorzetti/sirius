import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.organizationId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Dynamic URL based on environment (fallback to localhost if not set)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const checkoutSession = await stripe.checkout.sessions.create({
            ui_mode: 'embedded',
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "brl",
                        product_data: {
                            name: "Sirius CRM Pro",
                            description: "Acesso ilimitado e recursos premium para sua empresa.",
                        },
                        unit_amount: 4900, // R$ 49,00
                        recurring: {
                            interval: "month",
                        },
                    },
                    quantity: 1,
                },
            ],
            metadata: {
                organizationId: session.organizationId,
                userId: session.userId
            },
            return_url: `${appUrl}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
        });

        return NextResponse.json({ clientSecret: checkoutSession.client_secret });
    } catch (error) {
        console.error("[STRIPE_CHECKOUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

