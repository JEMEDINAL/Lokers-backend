FROM node:20-alpine AS builder
WORKDIR /app


RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM node:20-alpine AS production
WORKDIR /app


RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev \
  && npm install -g pm2 \
  && apk del python3 make g++

COPY --from=builder /app/dist ./dist
COPY ecosystem.config.js ./
COPY docker-entrypoint.sh ./

RUN mkdir -p /app/data \
  && chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["pm2-runtime", "ecosystem.config.js"]
