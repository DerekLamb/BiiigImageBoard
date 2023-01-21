# syntax=docker/dockerfile:1
FROM mongo:latest
WORKDIR /app
COPY . .

EXPOSE 27017


RUN sed -i -e 's/\r$//' /app/TestServ.sh

# HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=3 \
#     CMD ["/etc/init.d/mongod" "status"  ]
# CMD ["mongod"]

# CMD /app/TestServ.sh && /bin/bash

# https://stackoverflow.com/questions/64903289/with-a-container-running-mongodb-how-can-i-run-a-setup-script-on-start