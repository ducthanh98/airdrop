FROM node:12.22.12-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY bump_noproxy.js .

CMD [ "node", "main.js" ]