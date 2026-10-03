FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/ packages/
COPY services/ services/
COPY apps/ apps/
COPY rules/ rules/
COPY lab/ lab/
COPY tsconfig*.json ./

RUN npm ci
RUN npm run build

EXPOSE 4000 5173 8080

CMD ["npm", "run", "start", "-w", "@donttrust/api"]
