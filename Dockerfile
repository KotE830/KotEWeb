# Backend Dockerfile for Raspberry Pi
FROM node:20-slim

# Install build tools and dependencies for native modules
RUN apt-get update && apt-get install -y \
    ffmpeg \
    build-essential \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY tsconfig.server.json ./

# Install all dependencies (including devDependencies for building)
RUN npm ci --legacy-peer-deps

# Copy source files
COPY server.ts ./
COPY discord ./discord
COPY database ./database
COPY shared ./shared
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 8080

# Start script
CMD ["npm", "run", "server:prod"]

