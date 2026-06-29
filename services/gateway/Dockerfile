FROM node:lts

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./

COPY packages/common/package*.json ./packages/common/
COPY services/gateway/package*.json ./services/gateway/

RUN npm install

COPY packages/common ./packages/common
COPY services/gateway ./services/gateway

RUN cd packages/common && npm run build
RUN cd services/gateway && npm run build

WORKDIR /app/services/gateway

EXPOSE 80/tcp

CMD ["node", "dist/index.js"]