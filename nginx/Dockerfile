FROM nginx:alpine

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

RUN apk add openssl

ENTRYPOINT ["/entrypoint.sh"]