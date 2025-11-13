# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy root workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./

# Copy the idp-backend app
COPY apps/idp-backend ./apps/idp-backend

# Set auth token for private packages
ARG WEMOGY_PACKAGES_TOKEN
RUN echo "//npm.pkg.github.com/:_authToken=${WEMOGY_PACKAGES_TOKEN}" >> .npmrc

# Install dependencies for the idp-backend app
RUN pnpm install --frozen-lockfile --filter idp-backend

# Build the application
RUN cd apps/idp-backend && pnpm build

# Expose the port the app runs on
EXPOSE 3002

# Command to run the application
CMD ["node", "apps/idp-backend/dist/index.js"]