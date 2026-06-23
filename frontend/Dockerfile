FROM node:20-alpine AS deps

WORKDIR /app/frontend

COPY frontend/package.json ./
RUN npm install

FROM node:20-alpine AS builder

# Reproduit la structure monorepo (requis par outputFileTracingRoot dans next.config.ts)
WORKDIR /app
COPY frontend ./frontend
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules

WORKDIR /app/frontend

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ENABLE_VIDEO_CONSULTATION=true
ARG NEXT_PUBLIC_ENABLE_AI_FEATURES=false

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ENABLE_VIDEO_CONSULTATION=$NEXT_PUBLIC_ENABLE_VIDEO_CONSULTATION
ENV NEXT_PUBLIC_ENABLE_AI_FEATURES=$NEXT_PUBLIC_ENABLE_AI_FEATURES
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/frontend/public ./frontend/public
COPY frontend/docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
