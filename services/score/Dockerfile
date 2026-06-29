FROM node:lts

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./

COPY packages/common/package*.json ./packages/common/
COPY services/score/package*.json ./services/score/

RUN npm install

COPY packages/common ./packages/common
COPY services/score ./services/score

RUN cd packages/common && npm run build
RUN cd services/score && npm run build

WORKDIR /app/services/score

CMD ["node", "dist/index.js"]