
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build


FROM node:20-alpine
WORKDIR /app
RUN mkdir -p /app/uploads
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm install --only=production
RUN npm install -g wait-port
EXPOSE 3000
CMD ["node", "dist/main.js"]
