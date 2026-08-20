FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY . .
ENV NODE_ENV=production PORT=10114
EXPOSE 10114
CMD ["node", "server.js"]
