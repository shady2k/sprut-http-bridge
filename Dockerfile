# Multi-stage build for optimized production image
FROM node:lts-alpine AS builder

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set the working directory
WORKDIR /usr/src/app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (including dev dependencies for build if needed)
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Production stage
FROM node:lts-alpine AS production

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S app -u 1001 -G nodejs

# Set working directory
WORKDIR /usr/src/app

# Copy dependencies from builder stage
COPY --from=builder --chown=app:nodejs /usr/src/app/node_modules ./node_modules

# Copy application source
COPY --chown=app:nodejs . .

# Switch to non-root user
USER app

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]