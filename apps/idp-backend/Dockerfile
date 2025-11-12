# Base Stage: Common configuration
# Use official Node.js 20 image as base
FROM node:20-alpine AS base
# Set working directory in the base stage
WORKDIR /app

# Copy .npmrc for GitHub Packages authentication (if present)
COPY .npmrc ./

# Copy package.json and pnpm-lock.yaml (from root, since Turborepo)
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Dependencies Stage: Install only dependencies (good layer caching)
FROM base AS dependencies
RUN pnpm install --frozen-lockfile

# Builder Stage: Copy source code and build the application
FROM dependencies AS builder
# Copy only the app source code (not the entire root directory)
COPY apps/idp-backend/ ./
# Copy required packages from the monorepo
COPY packages/ ./packages/

# Build the application
RUN pnpm run build

# Production Stage: Use a slim image with only production dependencies
FROM node:20-alpine AS production
# Set working directory in the production container
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy only package.json and pnpm-lock.yaml for production dependencies
COPY .npmrc ./
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy the built application from the builder
COPY --from=builder /app/dist ./dist

# Copy any necessary config files
COPY --from=builder /app/package.json ./

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
