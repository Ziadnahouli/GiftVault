FROM node:20-slim

WORKDIR /app/server

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
