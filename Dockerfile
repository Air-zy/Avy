FROM node:18.18.2

# Add your application files and configurations
COPY . /app

# Set the working directory
WORKDIR /app

# Install dependencies and run your application
CMD ["npm", "start"]
