FROM node:18-alpine

WORKDIR /

COPY package.json ./
COPY package-lock.json ./
COPY data.json ./
COPY server.js ./
COPY public ./public

RUN npm install --production

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3003 || exit 1

CMD ["npm", "start"]