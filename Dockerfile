FROM node:20-slim

WORKDIR /app/server

# Install build tools for native addons
RUN apt-get update && apt-get install -y python3 make g++ sqlite3 && rm -rf /var/lib/apt/lists/*

# Copy server package files
COPY package.json ../package.json
COPY server/package.json ./

# Install server dependencies
RUN npm install

# Copy application source code
COPY server ./

# Build TypeScript code
RUN npm run build

# Expose HTTP port
EXPOSE 5000

ENV NODE_ENV=production

# Launch Node.js server from server directory
CMD ["node", "dist/index.js"]
