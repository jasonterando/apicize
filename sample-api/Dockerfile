FROM node:20
COPY ./index.js /var/app/index.js
COPY ./package.json /var/app/package.json

WORKDIR /var/app
RUN npm install

CMD [ "node", "index.js" ]