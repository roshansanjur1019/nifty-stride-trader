FROM node:20-alpine

WORKDIR /app

# Update Alpine packages and install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init curl

# Copy package files (including package-lock.json)
COPY package*.json ./

# Install dependencies (npm ci requires package-lock.json)
RUN npm ci --production --omit=dev && npm cache clean --force

# Copy application code
COPY . .

# Expose port
EXPOSE 4000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]

