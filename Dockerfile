# Use a modern, slim Node.js LTS version as the base image
FROM node:18-slim

# Install OpenSSL and postgresql-client (for pg_isready)
RUN apt-get update && apt-get install -y openssl postgresql-client

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker layer caching
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the Prisma schema to generate the client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application source code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Corrected: Add a wait-for-postgres script to the startup command
CMD [ "sh", "-c", "while ! pg_isready -h postgres -p 5432 -q -U user; do echo 'Waiting for database...'; sleep 2; done; npx prisma migrate deploy && npm start" ]
