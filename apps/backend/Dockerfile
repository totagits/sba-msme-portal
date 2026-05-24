# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy backend source (includes package.json + prisma/)
COPY apps/backend/ ./

# Install deps — uses prisma@5.10.x from package.json (not npx latest)
RUN npm install

# Prisma generate using the LOCAL installed version (avoids npx pulling Prisma 7+)
RUN ./node_modules/.bin/prisma generate

# Build TypeScript
RUN npm run build

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM node:20-alpine
RUN apk add --no-cache curl

WORKDIR /app

# Copy production artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p /app/uploads

EXPOSE 3001

CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/server.js"]
