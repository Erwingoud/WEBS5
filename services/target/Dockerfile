FROM node:lts

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./

COPY packages/common/package*.json ./packages/common/
COPY services/target/package*.json ./services/target/

RUN npm install

COPY packages/common ./packages/common
COPY services/target ./services/target

RUN cd packages/common && npm run build
RUN cd services/target && npm run build

WORKDIR /app/services/target

EXPOSE 80/tcp

CMD ["node", "dist/index.js"]