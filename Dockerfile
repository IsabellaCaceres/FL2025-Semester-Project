FROM oven/bun:1.2.18

WORKDIR /app

COPY bun.lock package.json bunfig.toml ./
COPY scripts ./scripts

ENV NODE_ENV=production \
    BUN_INSTALL_IGNORE_SCRIPTS=1 \
    EXPO_NO_TELEMETRY=1 \
    EXPO_PUBLIC_API_URL=http://host.docker.internal:4000

RUN bun install --frozen-lockfile

COPY . .

EXPOSE 19000 19001 19006 8081

CMD ["bun", "run", "web:docker"]

