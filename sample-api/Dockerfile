FROM node:20
WORKDIR /var/app
COPY ./package.json /var/app/package.json
RUN npm install

COPY ./index.js /var/app/index.js
COPY ./quote.js /var/app/quote.js
COPY ./image.js /var/app/image.js

CMD [ "node", "index.js" ]