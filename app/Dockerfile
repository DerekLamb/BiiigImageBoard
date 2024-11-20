FROM node:latest

LABEL Dev="DLamb"

WORKDIR /biiib

COPY . .

RUN apt-get update -qq && apt-get install ffmpeg -y

RUN npm ci

RUN npm run build 

RUN rm -rf src/ static/ Dockerfile .svelte-kit/

CMD ["node", "build/index.js"]