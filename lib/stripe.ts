import Stripe from 'stripe'

// Use a dummy key for build time if STRIPE_SECRET_KEY is not set
// This prevents build failures while still allowing runtime errors if actually used without a key
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_build'

export const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
})
