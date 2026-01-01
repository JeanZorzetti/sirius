/**
 * Environment Variable Validation
 *
 * This file validates that all required environment variables are set
 * and throws clear errors if any are missing.
 *
 * Import this file early in the application lifecycle to catch
 * configuration errors before they cause runtime issues.
 */

interface EnvConfig {
  // Database
  DATABASE_URL: string

  // Authentication
  SESSION_SECRET: string
  NEXTAUTH_SECRET: string
  NEXTAUTH_URL: string

  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string
  STRIPE_SECRET_KEY: string
  STRIPE_WEBHOOK_SECRET: string

  // App Configuration
  NEXT_PUBLIC_APP_URL: string
  NODE_ENV: 'development' | 'production' | 'test'

  // Optional: Email
  RESEND_API_KEY?: string

  // Optional: Sentry
  NEXT_PUBLIC_SENTRY_DSN?: string
  SENTRY_ORG?: string
  SENTRY_PROJECT?: string
  SENTRY_AUTH_TOKEN?: string
}

/**
 * Required environment variables that MUST be set
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_APP_URL',
] as const

/**
 * Insecure default values that should never be used in production
 */
const INSECURE_DEFAULTS = {
  SESSION_SECRET: ['super-secret-key-change-me', 'your-secret-key-here'],
  NEXTAUTH_SECRET: ['supersecret', 'your-secret-key-here'],
  STRIPE_SECRET_KEY: ['sk_test_dummy_key_for_build'],
} as const

/**
 * Validate environment variables
 * @throws Error if validation fails
 */
export function validateEnv(): EnvConfig {
  const errors: string[] = []

  // Check for missing required variables
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`)
    }
  }

  // Check for insecure defaults in production
  if (process.env.NODE_ENV === 'production') {
    for (const [key, insecureValues] of Object.entries(INSECURE_DEFAULTS)) {
      const value = process.env[key]
      if (value && (insecureValues as readonly string[]).includes(value)) {
        errors.push(
          `Insecure default value detected for ${key}. ` +
          `Please set a secure value in production. ` +
          `Generate a random string with: openssl rand -base64 32`
        )
      }
    }
  }

  // Throw all errors at once for better DX
  if (errors.length > 0) {
    throw new Error(
      `Environment variable validation failed:\n\n${errors.map(e => `  - ${e}`).join('\n')}\n\n` +
      `Please check your .env file and ensure all required variables are set.\n` +
      `See .env.example for a template.`
    )
  }

  return process.env as unknown as EnvConfig
}

/**
 * Validated environment configuration
 * Safe to use throughout the application
 */
export const env = validateEnv()

/**
 * Helper to check if we're in production
 */
export const isProduction = env.NODE_ENV === 'production'

/**
 * Helper to check if we're in development
 */
export const isDevelopment = env.NODE_ENV === 'development'

/**
 * Helper to check if we're in test
 */
export const isTest = env.NODE_ENV === 'test'
