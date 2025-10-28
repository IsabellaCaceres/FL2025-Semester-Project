FROM oven/bun:1.2.21 AS deps
WORKDIR /app

# Install dependencies using Bun (keeps cache separate from source)
COPY package.json bun.lock* bunfig.toml package-lock.json* ./
RUN bun install

FROM deps AS build
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}
COPY . .

# Generate derived data before producing the static web bundle
RUN bun run generate:epubs \
  && bunx expo export --platform web --output-dir dist

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

