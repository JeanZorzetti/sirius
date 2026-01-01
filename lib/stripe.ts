import Stripe from 'stripe'

// SECURITY: No default fallback - will fail fast if STRIPE_SECRET_KEY is missing
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
        'STRIPE_SECRET_KEY environment variable is required. ' +
        'Get your API keys from: https://dashboard.stripe.com/apikeys'
    )
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia', // Using latest stable API version
    typescript: true,
})
