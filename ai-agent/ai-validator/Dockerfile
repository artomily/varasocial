# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy manifests only — leverages Docker layer cache.
COPY package.json ./

# Install production dependencies only.
RUN npm install --omit=dev

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Least-privilege: run as non-root user.
RUN addgroup -S validator && adduser -S validator -G validator

WORKDIR /app

# Copy installed node_modules from build stage.
COPY --from=deps /app/node_modules ./node_modules

# Copy application source.
COPY src/ ./src/
COPY package.json ./

# Create logs directory owned by the app user.
RUN mkdir -p logs && chown -R validator:validator /app

USER validator

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
