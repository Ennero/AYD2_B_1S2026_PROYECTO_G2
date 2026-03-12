FROM node:22-alpine AS builder

WORKDIR /usr/src/app/server

COPY server/package*.json ./
RUN npm install

COPY server ./
COPY db ../db
RUN npm run build

FROM node:22-alpine

WORKDIR /usr/src/app/server

COPY --from=builder /usr/src/app/server/package*.json ./
COPY --from=builder /usr/src/app/server/node_modules ./node_modules
COPY --from=builder /usr/src/app/server/dist ./dist
COPY --from=builder /usr/src/app/db ../db

EXPOSE 3000

# Start command
CMD ["npm", "run", "start:prod"]
