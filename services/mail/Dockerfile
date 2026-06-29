FROM node:lts

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./

COPY packages/common/package*.json ./packages/common/
COPY services/mail/package*.json ./services/mail/

RUN npm install

COPY packages/common ./packages/common
COPY services/mail ./services/mail

RUN cd packages/common && npm run build
RUN cd services/mail && npm run build

WORKDIR /app/services/mail

EXPOSE 80/tcp

CMD ["node", "dist/index.js"]