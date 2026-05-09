/**
 * Centralized error keys for API responses.
 * Values are keys into messages/{locale}/api.json — NOT strings.
 * Use with apiError() from lib/api-error.ts:
 *   return apiError(ERR.UNAUTHORIZED, 401)
 */

export const ERR = {
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'notFound',
  INTERNAL_ERROR: 'internalError',
  BAD_REQUEST: 'badRequest',
  VALIDATION_ERROR: 'validationError',
  RATE_LIMITED: 'rateLimited',

  // Auth
  SESSION_EXPIRED: 'sessionExpired',

  // Organization
  ORG_NOT_FOUND: 'orgNotFound',
  ORG_REQUIRED: 'orgRequired',
  USER_NO_ORG: 'userNoOrg',
  FETCH_USER: 'fetchUser',

  // Resources
  CONTACT_NOT_FOUND: 'contactNotFound',
  DEAL_NOT_FOUND: 'dealNotFound',
  PIPELINE_NOT_FOUND: 'pipelineNotFound',
  CONNECTION_NOT_FOUND: 'connectionNotFound',
  MESSAGE_NOT_FOUND: 'messageNotFound',
  USER_NOT_FOUND: 'userNotFound',
  TAG_NOT_FOUND: 'tagNotFound',
  WEBHOOK_NOT_FOUND: 'webhookNotFound',
  AUTOMATION_NOT_FOUND: 'automationNotFound',
  API_KEY_NOT_FOUND: 'apiKeyNotFound',

  // Operations
  FAILED_CREATE: 'failedCreate',
  FAILED_UPDATE: 'failedUpdate',
  FAILED_DELETE: 'failedDelete',
  FAILED_FETCH: 'failedFetch',
  FAILED_SEND: 'failedSend',

  // Fields
  MISSING_FIELDS: 'missingFields',
  INVALID_INPUT: 'invalidInput',

  // Resources (extended)
  PRODUCT_NOT_FOUND: 'productNotFound',
  TASK_NOT_FOUND: 'taskNotFound',
  PROJECT_NOT_FOUND: 'projectNotFound',
  INSIGHT_NOT_FOUND: 'insightNotFound',

  // Auth flows
  RESET_PASSWORD: 'resetPassword',
  VALIDATE_TOKEN: 'validateToken',
  FORGOT_PASSWORD: 'forgotPassword',

  // Integrations
  CREATE_CHECKOUT: 'createCheckout',
  ENCRYPT_TOKEN: 'encryptToken',
  ENCRYPT_API_KEY: 'encryptApiKey',
  TEST_CONNECTION: 'testConnection',
  GOOGLE_CALENDAR_AUTH: 'googleCalendarAuth',

  // Misc
  DOWNLOAD_FILE: 'downloadFile',
  SEND_CONTACT_MESSAGE: 'sendContactMessage',
  AI_SERVER_UNAVAILABLE: 'aiServerUnavailable',
} as const
