# Stage 1: Build the Vite app using Node
FROM node:22-alpine AS builder

WORKDIR /app/ui/client

# Copy package info and install dependencies
COPY ui/client/package.json ./
# Try to copy package-lock.json if it exists, otherwise just package.json
COPY ui/client/package*.json ./
RUN npm install

# Copy the rest of the client code and build
COPY ui/client ./
RUN npm run build

# Stage 2: Serve the app using Deno
FROM denoland/deno:alpine

# Set environments
ENV WIREMOCK_URL="http://wiremock:8080"
ENV PORT=8000
EXPOSE 8000

WORKDIR /app

# Copy the server configuration
COPY ui/server.ts ./ui/server.ts

# Copy the built Vite app from the previous stage
COPY --from=builder /app/ui/client/dist ./ui/client/dist

# Set workdir back to ui for server execution
WORKDIR /app/ui

# Run the server
CMD ["run", "--allow-net", "--allow-read", "--allow-env", "server.ts"]
