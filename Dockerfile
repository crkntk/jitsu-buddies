ARG NODE_VERSION=26
ARG ALPINE_VERSION=3.24

# ---------- Production dependencies ----------
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS prod-build

WORKDIR /app

# Preserve this from your working image for now.
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .


# ---------- Dev ----------
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS dev

WORKDIR /app
ENV NODE_ENV=development

RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]


# ---------- Production ----------
FROM alpine:${ALPINE_VERSION} AS prod

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache \
      libstdc++ \
      libc6-compat \
      dumb-init \
    && addgroup -g 1000 node \
    && adduser -u 1000 -G node -s /bin/sh -D node

# Official Node npm-less pattern
COPY --from=prod-build /usr/local/bin/node /usr/local/bin/node
COPY --from=prod-build /usr/local/bin/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

COPY --from=prod-build --chown=node:node /app /app

USER node

ENTRYPOINT ["docker-entrypoint.sh"]

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["dumb-init", "node", "index.js"]