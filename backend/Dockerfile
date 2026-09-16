FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
FROM base AS dev
RUN npm install
COPY . .
EXPOSE 5070
CMD ["npm", "run", "dev"]
FROM base AS build
RUN npm ci --omit=dev
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY . .
EXPOSE 5070
CMD ["node", "server.js"]
