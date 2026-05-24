# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy frontend package files for layer caching
COPY apps/frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY apps/frontend/ ./

# Accept build arg for API URL
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
