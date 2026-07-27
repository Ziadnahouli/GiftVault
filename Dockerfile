FROM node:20-slim

WORKDIR /app

# Copy root and server package files
COPY package.json ./
COPY server/package.json ./server/

# Install server dependencies
RUN cd server && npm install

# Copy application source code
COPY server ./server

# Build TypeScript code
RUN cd server && npm run build

# Expose HTTP port
EXPOSE 5000

# Set default NODE_ENV
ENV NODE_ENV=production

# Launch Node.js server
CMD ["node", "server/dist/index.js"]
