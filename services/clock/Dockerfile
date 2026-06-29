FROM node:lts

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./

COPY packages/common/package*.json ./packages/common/
COPY services/clock/package*.json ./services/clock/

RUN npm install

COPY packages/common ./packages/common
COPY services/clock ./services/clock

RUN cd packages/common && npm run build
RUN cd services/clock && npm run build

WORKDIR /app/services/clock

CMD ["node", "dist/index.js"]