# Use Node.js v16
FROM node:16

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json before other files
# Utilize Docker cache to save re-installing dependencies if unchanged
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all files
COPY . .

RUN rm -rf /usr/src/app/node_modules/bcrypt && npm install bcrypt

# Compile TypeScript to JavaScript
RUN npm run build

# Expose the listening port
EXPOSE 3000

# Run the app
CMD [ "node", "dist/index.js" ]
