# Base Stage: Common configuration
# Use official Node.js 20 image as base
FROM node:20-alpine AS base
# Set working directory in the base stage
WORKDIR /app

# Define build argument for GitHub Packages token
ARG WEMOGY_PACKAGES_TOKEN

# Copy .npmrc for GitHub Packages authentication (if present) and configure authentication
COPY .npmrc ./

# Configure npm authentication for GitHub Packages using the token
RUN if [ -n "$WEMOGY_PACKAGES_TOKEN" ]; then \
        echo "//npm.pkg.github.com/:_authToken=$WEMOGY_PACKAGES_TOKEN" >> .npmrc; \
    fi

# Copy package.json and pnpm-lock.yaml (from root, since Turborepo)
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Dependencies Stage: Install only dependencies (good layer caching)
FROM base AS dependencies
RUN pnpm install --frozen-lockfile

# Builder Stage: Copy source code and build the application
FROM dependencies AS builder

# Define build argument for GitHub Packages token
ARG WEMOGY_PACKAGES_TOKEN

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

# Define build argument for GitHub Packages token
ARG WEMOGY_PACKAGES_TOKEN

# Install pnpm globally
RUN npm install -g pnpm

# Copy only package.json and pnpm-lock.yaml for production dependencies
COPY .npmrc ./

# Configure npm authentication for GitHub Packages using the token
RUN if [ -n "$WEMOGY_PACKAGES_TOKEN" ]; then \
        echo "//npm.pkg.github.com/:_authToken=$WEMOGY_PACKAGES_TOKEN" >> .npmrc; \
    fi

COPY package.json pnpm-lock.yaml ./

# Install only production dependencies, skipping lifecycle scripts to avoid husky prepare step
ENV npm_config_ignore_scripts=true
RUN pnpm install --frozen-lockfile --prod
ENV npm_config_ignore_scripts=false

# Copy the built application from the builder
COPY --from=builder /app/dist ./dist

# Copy any necessary config files
COPY --from=builder /app/package.json ./

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
