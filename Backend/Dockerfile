# Build stage (also used for one-off demo seed: --profile seed)
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

FROM builder AS seed

CMD ["npm", "run", "seed"]

# Production stage
FROM node:20-alpine

WORKDIR /app

# openssl (Prisma) + build tools (bcrypt natif)
RUN apk add --no-cache openssl python3 make g++

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev \
  && npm install --no-save prisma@^6.3.0 \
  && npx prisma generate

COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh && mkdir -p uploads

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
