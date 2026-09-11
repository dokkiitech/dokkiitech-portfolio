FROM node:22.16.0-alpine

WORKDIR /app
COPY services/telnet-booking/ ./

USER node
EXPOSE 2323

CMD ["node", "server.mjs"]
