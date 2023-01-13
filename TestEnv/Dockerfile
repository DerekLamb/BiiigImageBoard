# syntax=docker/dockerfile:1
FROM mongo:latest
WORKDIR /app
COPY . .

EXPOSE 27017


RUN sed -i -e 's/\r$//' /app/TestServ.sh

# RUN /app/install.sh
