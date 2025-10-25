#!/bin/bash

# Workbench Server Startup Script

echo "🚀 Starting Workbench Server..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Starting MongoDB..."
    
    # Try to start MongoDB with Docker
    if command -v docker &> /dev/null; then
        echo "🐳 Starting MongoDB with Docker..."
        docker run -d -p 27017:27017 --name workbench-mongodb mongo:latest
        sleep 5
    else
        echo "❌ Docker not found. Please start MongoDB manually:"
        echo "   brew services start mongodb-community"
        echo "   or"
        echo "   mongod"
        exit 1
    fi
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building TypeScript..."
npm run build

# Start the server
echo "🌟 Starting server..."
npm run dev
