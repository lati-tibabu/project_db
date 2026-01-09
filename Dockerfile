FROM node:20-alpine

WORKDIR /app

# Copy package files from the root as the server depends on them
COPY package*.json ./
RUN npm install --production

# Copy server code and data
COPY server/ ./server/
COPY data/ ./data/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the API port
EXPOSE 5000

# Run the server
CMD ["node", "server/index.js"]
