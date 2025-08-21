# ---------- Install deps (cached layer) ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---------- Dev image (hot reload) ----------
FROM node:20-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
# Your package.json should have: "dev": "nodemon index.js"
CMD ["npm","run","dev"]

# ---------- Production runtime ----------
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
USER node
# Install only prod deps
COPY package*.json ./
RUN npm ci --omit=dev
# Copy only what's needed to run
COPY --chown=node:node ./index.js ./index.js
# If you have other runtime folders, uncomment as needed:
# COPY --chown=node:node ./public ./public
# COPY --chown=node:node ./views ./views
EXPOSE 3000
# Optional healthcheck hitting /health
HEALTHCHECK --interval=30s --timeout=3s \
    CMD node -e "require('http').get('http://localhost:3000/health', r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
CMD ["node","index.js"]