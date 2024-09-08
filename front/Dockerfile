FROM node:20.16.0
WORKDIR /app
ENV NODE_ENV production
COPY package*.json yarn.lock  ./
COPY . .
RUN yarn install
RUN yarn build
CMD [ "yarn", "start" ]
