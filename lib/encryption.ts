/**
 * AES-256-GCM Encryption Utility
 *
 * Used to securely encrypt and decrypt sensitive integration credentials:
 * - N8N API keys
 * - Evolution API keys
 * - Google Calendar OAuth refresh tokens
 * - Google Ads OAuth refresh tokens
 * - Facebook/Meta Ads access tokens
 *
 * Encryption format: "iv:authTag:encryptedData" (all hex-encoded)
 *
 * @requires INTEGRATION_ENCRYPTION_KEY environment variable (64-char hex string)
 * Generate key with: openssl rand -hex 32
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits
const AUTH_TAG_LENGTH = 16 // 128 bits

/**
 * Encrypts plaintext using AES-256-GCM
 *
 * @param text - Plaintext to encrypt (API key, token, etc.)
 * @returns Encrypted string in format "iv:authTag:encryptedData"
 * @throws Error if INTEGRATION_ENCRYPTION_KEY is not set or invalid
 */
export function encrypt(text: string): string {
  const encryptionKey = process.env.INTEGRATION_ENCRYPTION_KEY

  if (!encryptionKey) {
    throw new Error('INTEGRATION_ENCRYPTION_KEY environment variable is not set')
  }

  if (encryptionKey.length !== 64) {
    throw new Error('INTEGRATION_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
  }

  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = Buffer.from(encryptionKey, 'hex')

  // Create cipher and encrypt
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  // Get authentication tag
  const authTag = cipher.getAuthTag()

  // Return in format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypts encrypted data using AES-256-GCM
 *
 * @param encryptedData - Encrypted string in format "iv:authTag:encryptedData"
 * @returns Decrypted plaintext
 * @throws Error if INTEGRATION_ENCRYPTION_KEY is not set, invalid, or decryption fails
 */
export function decrypt(encryptedData: string): string {
  const encryptionKey = process.env.INTEGRATION_ENCRYPTION_KEY

  if (!encryptionKey) {
    throw new Error('INTEGRATION_ENCRYPTION_KEY environment variable is not set')
  }

  if (encryptionKey.length !== 64) {
    throw new Error('INTEGRATION_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
  }

  // Parse encrypted data
  const parts = encryptedData.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format. Expected "iv:authTag:encryptedData"')
  }

  const [ivHex, authTagHex, encrypted] = parts

  // Convert from hex
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const key = Buffer.from(encryptionKey, 'hex')

  // Create decipher and decrypt
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Validates that the encryption key is properly configured
 *
 * @returns true if key is valid, false otherwise
 */
export function isEncryptionKeyValid(): boolean {
  const encryptionKey = process.env.INTEGRATION_ENCRYPTION_KEY

  if (!encryptionKey || encryptionKey.length !== 64) {
    return false
  }

  try {
    // Test encryption/decryption
    const testData = 'test'
    const encrypted = encrypt(testData)
    const decrypted = decrypt(encrypted)
    return decrypted === testData
  } catch (error) {
    return false
  }
}
