FROM node

COPY package.json /src/package.json
RUN npm -g update yo
RUN cd /src; npm install
RUN bower install

COPY . /src

EXPOSE  9000

CMD ["node", "/src/index.js"]

