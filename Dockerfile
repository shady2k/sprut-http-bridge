# Use the official Node.js LTS image as a parent image
FROM node:lts

# Set the working directory in the Docker container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available) to the container
COPY package.json ./
COPY package-lock.json* ./

# Install app dependencies using npm ci
RUN npm ci --omit=dev --ignore-scripts

# Bundle app source inside Docker image
COPY . .

# Your app binds to a specific port, make sure you expose it
EXPOSE 3000

# Define the command to run your app using CMD
CMD [ "npm", "start" ]