FROM node:20-alpine
WORKDIR /app/api
RUN apk add --no-cache python3 make g++
COPY api/package.json ./
RUN npm install --omit=dev && apk del python3 make g++
COPY api/src ./src
COPY web /app/web
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["node","src/server.js"]
