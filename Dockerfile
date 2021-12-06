FROM FROM node:16.13.0-alpine3.13
MAINTAINER "contact@koumoul.com"

ENV NODE_ENV production

WORKDIR /webapp
ADD package.json .
ADD package-lock.json .
RUN npm install --production

ADD config config
ADD server server
ADD README.md .

EXPOSE 8080

CMD ["node", "--max-http-header-size", "64000", "server"]
