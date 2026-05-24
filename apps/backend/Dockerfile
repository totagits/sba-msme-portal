# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy backend source (includes package.json + prisma/)
COPY apps/backend/ ./

# Configure npm for resilient installs (retry on network errors)
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000

# Install deps with retry loop to handle transient ECONNRESET errors
RUN for i in 1 2 3; do npm install && break || { echo "npm install attempt $i failed, retrying..."; sleep 10; }; done

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
