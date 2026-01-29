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
COPY scripts ./scripts

# Copy 'prisma' folder before 'npm install'
COPY prisma ./prisma

# Install all dependencies (including devDependencies for building)
RUN npm install --legacy-peer-deps && npm cache clean --force && rm -rf /root/.npm

# Copy source files
COPY server.ts ./
COPY discord ./discord
COPY database ./database
COPY shared ./shared

# Generate Prisma Client (using temporary env vars for build)
RUN POSTGRES_USER=temp POSTGRES_PASSWORD=temp POSTGRES_DB=temp DATABASE_URL=postgresql://temp:temp@localhost:5432/temp npx prisma generate

# Expose port
EXPOSE 8080

# Start script
CMD ["npm", "run", "server:prod"]

