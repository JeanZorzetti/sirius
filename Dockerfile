# ============================================
# Sirius CRM - Production Dockerfile
# Multi-stage build for optimized Next.js app
# ============================================

# ===== Base Stage =====
FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package*.json ./

# ===== Dependencies Stage =====
FROM base AS deps

RUN npm ci --legacy-peer-deps

# ===== Builder Stage =====
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (schema only, no DB connection needed)
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js (migrations run at container start, not build time)
RUN node_modules/.bin/next build

# ===== Runner Stage =====
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl curl

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma schema + client for migrations at startup
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Entrypoint: run migrations then start app
COPY --chown=nextjs:nodejs docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
