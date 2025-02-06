FROM node:18-alpine

WORKDIR /usr/src/app

# Install nodemon globally for development
RUN npm install -g nodemon

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Make port configurable via environment variable
EXPOSE ${PORT}

# Use nodemon for development
CMD ["sh", "-c", "nodemon server/server.js"]