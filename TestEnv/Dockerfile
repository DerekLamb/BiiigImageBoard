# syntax=docker/dockerfile:1
FROM mongo:latest
WORKDIR /app
COPY . .

EXPOSE 8800
EXPOSE 8801

RUN sed -i -e 's/\r$//' /app/install.sh
RUN sed -i -e 's/\r$//' /app/run.sh
RUN sed -i -e 's/\r$//' "/app/run front.sh"
RUN sed -i -e 's/\r$//' "/app/run back.sh"

RUN /app/install.sh
