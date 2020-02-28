FROM node:13

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .


EXPOSE 8000
# EXPOSE 8001
# EXPOSE 8002
# EXPOSE 8003
# EXPOSE 8004
# EXPOSE 8005

CMD [ "npm", "start", "run" ]