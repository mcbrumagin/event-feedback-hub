# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/frontend/package.json ./packages/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/frontend ./packages/frontend

# Build shared package first, then frontend
RUN pnpm --filter @event-feedback-hub/shared build
RUN pnpm --filter @event-feedback-hub/frontend build

# Production stage - serve with nginx
FROM nginx:alpine AS runner

# Copy custom nginx config
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
