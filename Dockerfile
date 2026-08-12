###############################################################################
# SQLQuest — multi-stage production image
#
# Stages:
#   deps    install node_modules once, cached on the lockfile alone
#   builder compile the Next.js standalone bundle
#   runner  minimal runtime: node + the standalone output, non-root
#
# The final image contains no source, no dev dependencies and no package
# manager — just the traced server bundle Next.js produces with
# `output: "standalone"`.
###############################################################################

ARG NODE_VERSION=24-alpine

# ----------------------------------------------------------------- deps ------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# libc6-compat keeps native addons (pg's optional bindings) happy on musl.
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
# Deliberately no BuildKit cache mount: the layer cache on package-lock.json
# already gives us the win, and this keeps the image buildable with the classic
# builder (no buildx required) in restricted CI environments.
RUN npm ci --ignore-scripts

# --------------------------------------------------------------- builder -----
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js inlines NEXT_PUBLIC_* at build time, so the public origin has to be
# known here. Override with --build-arg for a real deployment.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# A placeholder secret satisfies Auth.js during prerendering. It is never
# baked into the image — the runtime reads AUTH_SECRET from the environment.
RUN AUTH_SECRET=build-only-placeholder npm run build

# ---------------------------------------------------------------- runner -----
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Migrations + the runner script, so a container can bring its own schema up.
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle

USER nextjs
EXPOSE 3000

# The app serves fine without a database, so the probe checks the app itself.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
