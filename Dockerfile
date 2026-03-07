# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (including devDependencies)
COPY worker/package.json worker/package-lock.json ./worker/
RUN cd worker && npm ci

# Copy source and TypeScript config, then compile
COPY worker/src ./worker/src
COPY worker/tsconfig.json worker/tsconfig.build.json ./worker/
RUN cd worker && npm run build

# ---- Runtime stage ----
FROM node:20-alpine

WORKDIR /app

# Copy only the compiled output from the build stage (no devDependencies)
COPY --from=builder /app/worker/dist ./worker/dist

# Run as the built-in non-root node user
USER node

# Expose the port the server listens on
EXPOSE 8000

CMD ["node", "/app/worker/dist/server.js"]
