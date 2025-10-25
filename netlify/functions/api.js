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

  console.log('Creating new database connection...');
  console.log('Connection string starts with:', MONGODB_URI.substring(0, 20) + '...');
  
  try {
    const connection = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    console.log('Database connected successfully');
    cachedDb = connection;
    return connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

// Health check route
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  
  let recipeCount = 0;
  let collections = [];
  
  try {
    if (dbStatus === 1) {
      // Get collection names
      const db = mongoose.connection.db;
      const collectionList = await db.listCollections().toArray();
      collections = collectionList.map(c => c.name);
      
      // Get recipe count if collection exists
      if (collections.includes('recipes')) {
        const Recipe = mongoose.connection.collection('recipes');
        recipeCount = await Recipe.countDocuments();
      }
    }
  } catch (error) {
    console.error('Error fetching DB stats:', error);
  }
  
  res.json({
    success: true,
    message: 'API is running on Netlify Functions',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus === 1 ? 'connected' : dbStatus === 2 ? 'connecting' : 'disconnected',
    collections: collections,
    recipeCount: recipeCount,
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
  } catch (error) {
    console.error('Database connection error:', error);
    
    // Return error response for DB-dependent routes
    if (event.path.includes('/api/recipes')) {
      return {
        statusCode: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          message: 'Database connection failed. Please check MongoDB configuration.',
          error: error.message,
        }),
      };
    }
    // Continue for non-DB routes like health check
  }
  
  return serverless(app)(event, context);
};

module.exports = { handler };
module.exports.handler = handler;

