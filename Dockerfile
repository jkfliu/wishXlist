FROM node:18-alpine

WORKDIR /app

# Install and build client
COPY client/package*.json ./client/
RUN cd client && npm ci --legacy-peer-deps
COPY client/ ./client/
RUN cd client && npm run build

# Install server dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev
COPY server/ ./server/

EXPOSE 3000
CMD ["node", "server/index.js"]
