# Base image to use
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Clean and install dependencies
RUN npm install --legacy-peer-deps

# Copy project files
COPY . .

# Create necessary directories
RUN mkdir -p public/uploads/products
RUN mkdir -p src/public/images

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application with proper error handling
CMD ["node", "src/app.js"]
