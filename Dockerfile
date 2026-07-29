FROM node:22.21.1-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

# Build at image build time
RUN yarn build:web

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
