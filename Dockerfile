FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git bash

COPY package*.json ./
RUN npm install

RUN npm install git+https://github.com/baddrottuleCode/bc-library-healthcheck-be-nestjs.git
RUN npm install git+https://github.com/baddrottuleCode/bc-library-firestore-nestjs.git

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 8080

USER node

CMD ["node", "dist/main"]