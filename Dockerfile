# ============================================
# Sirius CRM - Production Dockerfile
# ============================================

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ===== Dependencies =====
# This layer is cached until package*.json changes
FROM base AS deps
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --legacy-peer-deps

# ===== Builder =====
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy source AFTER deps to maximize cache hits
COPY . .
RUN node_modules/.bin/prisma generate && \
    node_modules/.bin/prisma generate --schema prisma/whatsapp.prisma
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# ponytail: sem type gate aqui. O job `typecheck` do ci.yml roda `tsc --noEmit`
# sobre um conjunto maior de arquivos (tsconfig.json, sem os excludes do
# tsconfig.build.json) a cada push. Rodar de novo aqui custava ~1-2min serial no
# caminho critico do deploy. Ressalva: o CI roda EM PARALELO com o deploy do
# EasyPanel — o gate so bloqueia de verdade com branch protection na `main`.
# Turbopack (padrao do Next 16). O `--webpack` entrou em ec9104a por OOM no
# builder, mas junto com dois confundidores que ja sairam: os plugins do Sentry
# (f4a7a93, agora so carregam com SENTRY_ORG setado) e o tsc dentro do next
# build. Sobrou o bundler sozinho, que cabe.
# ROLLBACK: se voltar a estourar, o sintoma diz qual e o teto.
#   "JavaScript heap out of memory" -> heap V8, sobe o --max-old-space-size
#   exit 137 / "Killed"             -> RAM do container; o Turbopack aloca do
#                                      lado Rust, NODE_OPTIONS nao segura isso.
#                                      Nesse caso volte o `--webpack` aqui.
RUN NODE_OPTIONS="--max-old-space-size=2048" node_modules/.bin/next build
# ponytail: o runner sobe com `node server.js`. Se o bundler parar de emitir
# esse arquivo (no Windows ja nao emite: chunk `node:inspector` tem `:` no nome
# e o copyfile da EINVAL), o container entra em crash-loop em producao. Falhar
# o BUILD e mais barato que descobrir isso no healthcheck.
RUN test -f .next/standalone/server.js

# ===== Runner =====
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl curl ffmpeg && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma/client-wa ./node_modules/.prisma/client-wa
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

COPY --chown=nextjs:nodejs docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
