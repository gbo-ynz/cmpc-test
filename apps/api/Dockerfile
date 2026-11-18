# syntax=docker/dockerfile:1
# Build context: repository root (npm workspaces share one lockfile).

FROM node:22-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
# Git hooks are a developer concern: never run husky inside the image.
RUN npm pkg delete scripts.prepare

FROM base AS build
RUN npm ci --workspace apps/api --include-workspace-root
COPY apps/api apps/api
RUN npm run prisma:generate --workspace apps/api \
  && npm run build --workspace apps/api \
  && npm prune --omit=dev --workspace apps/api \
  && mkdir -p apps/api/node_modules

FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --chown=node:node apps/api/prisma ./apps/api/prisma
COPY --chown=node:node apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh
WORKDIR /app/apps/api
RUN mkdir -p uploads && chown node:node uploads
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
