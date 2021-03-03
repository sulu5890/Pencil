FROM node:15-alpine3.13
RUN apk update && apk add git
RUN mkdir -p /ink && chown -R node:node /ink
WORKDIR /ink
COPY --chown=node:node package.json ./
COPY --chown=node:node yarn.lock ./
USER node
RUN yarn install
COPY --chown=node:node . .
CMD ["yarn", "start"]
