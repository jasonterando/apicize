FROM node:20
COPY ./index.js /var/app/index.js
COPY ./quote.js /var/app/quote.js
COPY ./image.js /var/app/image.js
COPY ./package.json /var/app/package.json

WORKDIR /var/app
RUN npm install

CMD [ "node", "index.js" ]