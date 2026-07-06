FROM oven/bun:1-alpine
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY src ./src

ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/app/data/kcal.db

# uid 1000, matches fsGroup 1000 on the NFS subPath
USER bun
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
