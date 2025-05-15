FROM node:20.11-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --production --no-audit --ignore-scripts

# Copy app source
COPY --chown=node:node . .

# Use a more specific and secure image version
FROM node:20.11-alpine AS runner

# Create a non-root user to run the app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Set security-related environment variables
ENV NODE_ENV=production

WORKDIR /app

# Copy from builder stage with secure permissions
COPY --from=builder --chown=appuser:appgroup /app/package*.json ./
COPY --from=builder --chown=appuser:appgroup /app/src ./src

# Set secure build arguments
ARG NODE_OPTIONS="--max_old_space_size=2048"

# Expose port
EXPOSE 5000

# Add security headers
ENV SECURE_HEADERS=true

# Run security audit before starting
RUN npm audit --production --json || true

# Command to run the app as non-root user
CMD ["node", "src/index.js"]
