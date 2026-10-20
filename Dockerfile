
# ============================================================
# Stage 1: Build
# ============================================================
FROM node:22.21.1-alpine AS builder

WORKDIR /app

RUN corepack enable

# Copy dependency manifests for better layer caching
COPY package.json yarn.lock ./

# Install build dependencies with a longer timeout
RUN yarn install --frozen-lockfile \
    --network-timeout 300000 \
    --network-concurrency 4

# Copy application source
COPY . .

# Build frontend
RUN yarn build:web


# ============================================================
# Stage 2: Production Runtime
# ============================================================
FROM node:22.21.1-alpine AS runtime

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup

RUN corepack enable

# Copy dependency manifests
COPY --from=builder /app/package.json /app/yarn.lock ./

# Install production dependencies deterministically
RUN yarn install --frozen-lockfile --production=true \
    --network-timeout 300000 \
    --network-concurrency 4 && \
    yarn cache clean

# Copy server and frontend build
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/entrypoint.sh /entrypoint.sh

# Set permissions
RUN chmod 755 /entrypoint.sh && \
    chown -R appuser:appgroup /app /entrypoint.sh

USER appuser

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
