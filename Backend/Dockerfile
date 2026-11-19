
FROM node:20-slim

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy backend source code
COPY . .

# Generate Prisma Client
# RUN npx prisma generate

# Application port
EXPOSE 5000

# Start backend server
CMD ["npx", "tsx", "src/server.ts"]
