FROM node:latest

LABEL Dev="DLamb"

WORKDIR /biiib

COPY . .

RUN npm ci

RUN npm run build 

RUN rm -rf src/ static/ Dockerfile

CMD ["ls", "-la"]