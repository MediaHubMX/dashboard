FROM node:22-alpine
WORKDIR /code
COPY index.html server.mjs ./
USER node
CMD ["node", "server.mjs"]
