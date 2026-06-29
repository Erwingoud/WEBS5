FROM node:lts

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./

COPY packages/common/package*.json ./packages/common/
COPY services/auth/package*.json ./services/auth/

RUN npm install

COPY packages/common ./packages/common
COPY services/auth ./services/auth

RUN cd packages/common && npm run build
RUN cd services/auth && npm run build

WORKDIR /app/services/auth

EXPOSE 80/tcp

CMD ["node", "dist/index.js"]