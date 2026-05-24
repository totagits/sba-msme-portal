# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy frontend source
COPY apps/frontend/ ./

# Configure npm for resilient installs (retry on network errors)
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000

# Install ALL deps (including vite/tailwind devDependencies needed for build)
RUN for i in 1 2 3; do npm install && break || { echo "npm install attempt $i failed, retrying..."; sleep 10; }; done

# Accept API URL build arg
ARG VITE_API_URL=http://localhost:3001/api
ENV VITE_API_URL=${VITE_API_URL}

# Build Vite app
RUN npm run build

# ── Stage 2: Nginx ───────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY apps/frontend/docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
