FROM node:20 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:20 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs || true
RUN useradd --system --uid 1001 --gid 1001 nextjs || true

COPY --from=builder /app/public        ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static      ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
