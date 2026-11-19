# One image, two roles: `node src/server.ts` (API) or `node src/worker.ts` (jobs).
# Node 24 runs TypeScript directly (type stripping), so there is no build stage for the server.
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
RUN npm ci --omit=dev --workspace server --include-workspace-root=false && npm cache clean --force
COPY server/src server/src
COPY server/drizzle server/drizzle
WORKDIR /app/server
USER node
EXPOSE 3000
CMD ["node", "src/server.ts"]
