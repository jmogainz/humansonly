# syntax=docker/dockerfile:1.4

FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat curl
COPY package*.json ./
COPY scripts/dev-env-entrypoint.sh /usr/local/bin/dev-env-entrypoint.sh
RUN chmod +x /usr/local/bin/dev-env-entrypoint.sh
RUN --mount=type=cache,target=/root/.npm npm ci --progress=false

FROM node:20-alpine AS builder
WORKDIR /app

ARG ENV=dev
ARG NEXT_PUBLIC_ENV=dev
ARG NEXT_PUBLIC_DEVTOOLS_ENABLED=0
ARG ENABLE_NGROK_FOR_DEV=0
ARG ENABLE_CLOUDFLARED_FOR_DEV=0
ARG APP_URL_FROM_ANYWHERE=

ENV ENV=${ENV}
ENV NEXT_PUBLIC_ENV=${NEXT_PUBLIC_ENV}
ENV NEXT_PUBLIC_DEVTOOLS_ENABLED=${NEXT_PUBLIC_DEVTOOLS_ENABLED}
ENV ENABLE_NGROK_FOR_DEV=${ENABLE_NGROK_FOR_DEV}
ENV ENABLE_CLOUDFLARED_FOR_DEV=${ENABLE_CLOUDFLARED_FOR_DEV}
ENV APP_URL_FROM_ANYWHERE=${APP_URL_FROM_ANYWHERE}
ENV NEXTAUTH_URL=${APP_URL_FROM_ANYWHERE}
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY next.config.mjs ./
COPY tsconfig.json ./
COPY next-env.d.ts ./
COPY middleware.ts ./
COPY vercel.json ./
COPY public ./public
COPY src ./src

RUN --mount=type=cache,target=/app/.next/cache \
    --mount=type=cache,target=/root/.npm \
    npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ARG ENV=dev
ARG NEXT_PUBLIC_ENV=dev
ARG NEXT_PUBLIC_DEVTOOLS_ENABLED=0
ARG ENABLE_NGROK_FOR_DEV=0
ARG ENABLE_CLOUDFLARED_FOR_DEV=0
ARG APP_URL_FROM_ANYWHERE=

ENV ENV=${ENV}
ENV NEXT_PUBLIC_ENV=${NEXT_PUBLIC_ENV}
ENV NEXT_PUBLIC_DEVTOOLS_ENABLED=${NEXT_PUBLIC_DEVTOOLS_ENABLED}
ENV ENABLE_NGROK_FOR_DEV=${ENABLE_NGROK_FOR_DEV}
ENV ENABLE_CLOUDFLARED_FOR_DEV=${ENABLE_CLOUDFLARED_FOR_DEV}
ENV APP_URL_FROM_ANYWHERE=${APP_URL_FROM_ANYWHERE}
ENV NEXTAUTH_URL=${APP_URL_FROM_ANYWHERE}
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache curl libc6-compat

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 8080

CMD ["npm", "run", "start"]
