import pino from 'pino'

// Create logger instance with configuration based on environment
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Pretty print in development, JSON in production
  ...(process.env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),

  // Base fields for all logs
  base: {
    env: process.env.NODE_ENV,
  },

  // Serializers for common objects
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
})

/**
 * Create a child logger with additional context
 * @param context - Additional fields to include in all logs
 * @returns Child logger instance
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context)
}

/**
 * Generate a correlation ID for request tracking
 * @returns UUID v4 string
 */
export function generateCorrelationId(): string {
  return crypto.randomUUID()
}

/**
 * Log levels:
 * - trace: Very detailed logs (function entry/exit)
 * - debug: Diagnostic information
 * - info: General informational messages
 * - warn: Warning messages
 * - error: Error messages
 * - fatal: Critical errors that cause termination
 */

export default logger
