# Use the official Node.js image as base
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy root package.json and install root dependencies (for workspaces)
COPY package.json ./ 
RUN npm install

# Copy all packages
COPY packages ./packages

# Install dependencies for each workspace
WORKDIR /app/packages/backend
RUN npm install
RUN npm run build # Build backend in the container
RUN ls -l dist # Debug step

WORKDIR /app/packages/frontend
RUN npm install
RUN npm run build # Build frontend in the container

# Use a smaller image for runtime
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Expose port (matches server.ts PORT env var)
EXPOSE 3030

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:3030/health || exit 1

# Start the backend server
WORKDIR /app/packages/backend
CMD ["node", "dist/server.js"]
