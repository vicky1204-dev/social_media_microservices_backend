FROM node:18-alpine

#set working directory; all subsequent commands will be run from here
WORKDIR /user/src/app
COPY package*.json ./

RUN npm ci --only=production 
#only=production flag ensures dev dependencies are not installed

#now copy rest of the app code to the working directory
COPY . .

#informing docker which port this container listens ; only documentation purpose it doesnt actully publish it
EXPOSE 3002

CMD [ "node", "src/server.js" ]