FROM node:latest
WORKDIR /biiib

COPY package.json .

RUN npm install

COPY . .

CMD ["npm", "run", "dev", "--host"]

# EXPOSE PORT

# RUN sed -i -e 's/\r$//' /app/TestServ.sh
