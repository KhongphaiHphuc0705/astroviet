# ==============================================================================
# Stage 1: Base
# ==============================================================================
FROM node:22-alpine AS base
# Install OpenSSL and libc6-compat (required by Prisma on Alpine)
RUN apk add --no-cache openssl libc6-compat
WORKDIR /usr/src/app

# ==============================================================================
# Stage 2: Dependencies
# ==============================================================================
FROM base AS deps
COPY package.json package-lock.json ./
# Install ALL dependencies (including dev) for building
RUN npm ci

# ==============================================================================
# Stage 3: Builder
# ==============================================================================
FROM base AS builder
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
# Generate Prisma Client
RUN npm run prisma:generate
# Build TypeScript to dist/
RUN npm run build

# ==============================================================================
# Stage 4: Production Runtime
# ==============================================================================
FROM base AS runner
ENV NODE_ENV=production

# Switch to non-root user
USER node

# Copy package info
COPY --chown=node:node package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy generated Prisma Client
COPY --chown=node:node --from=builder /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --chown=node:node --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Copy built artifacts
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

# Healthcheck using native Node fetch (no curl needed)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/live').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

EXPOSE 3000

# Native ESM support and Source Maps
ENTRYPOINT ["node", "--enable-source-maps", "dist/server.js"]
