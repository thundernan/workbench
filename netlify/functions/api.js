const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

// Import your routes from built JavaScript
const recipeRoutes = require('../../server/dist/routes/recipeRoutes').default;

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection with caching
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  console.log('Creating new database connection');
  const connection = await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  cachedDb = connection;
  return connection;
}

// Health check route
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  res.json({
    success: true,
    message: 'API is running on Netlify Functions',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus === 1 ? 'connected' : dbStatus === 2 ? 'connecting' : 'disconnected',
  });
});

// API routes
app.use('/api/recipes', recipeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Initialize database connection before handling requests
const handler = async (event, context) => {
  // Prevent Lambda from waiting for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    await connectToDatabase();
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection error:', error);
    // Continue anyway - some routes might not need DB
  }
  
  return serverless(app)(event, context);
};

module.exports = { handler };
module.exports.handler = handler;

