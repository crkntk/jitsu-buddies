# ---------- Dependencies layer ----------
FROM node:24.13.1-alpine AS deps
WORKDIR /app
# sharp needs this on Alpine for prebuilt binaries
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci

# ---------- Dev image (hot reload) ----------
FROM node:24.13.1-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm","run","dev"]

# ---------- Production runtime ----------
FROM node:24.13.1-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
# install as root, then drop privileges
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN adduser -D appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s \
    CMD node -e "require('http').get('http://localhost:3000/health', r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
CMD ["node","index.js"]
