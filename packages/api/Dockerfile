# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/api ./packages/api

# Build shared package first, then API
RUN pnpm --filter @event-feedback-hub/shared build
RUN pnpm --filter @event-feedback-hub/api build

# Production stage
FROM node:20-alpine AS runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/api/package.json ./packages/api/

# Copy built files
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/api/dist ./packages/api/dist

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

EXPOSE 4000

CMD ["node", "packages/api/dist/server.js"]
