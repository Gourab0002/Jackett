FROM node:20-alpine

WORKDIR /app

# Copy worker package files for dependency installation
COPY worker/package.json worker/package-lock.json ./worker/

# Install worker dependencies
RUN cd worker && npm ci

# Copy worker source and TypeScript config
COPY worker/src ./worker/src
COPY worker/tsconfig.json worker/tsconfig.build.json ./worker/

# Build TypeScript to dist/
RUN cd worker && npm run build

# Expose the port the server listens on
EXPOSE 8000

CMD ["node", "/app/worker/dist/server.js"]
