import express, { Router } from 'express';
import serverless from 'serverless-http';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';

// Import your routes
// Note: Update these paths based on your actual server structure
const recipeRoutes = require('../../server/src/routes/recipeRoutes');

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
let cachedDb: typeof mongoose | null = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const MONGODB_URI = process.env.MONGODB_URI || process.env.VITE_MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  const connection = await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  cachedDb = connection;
  return connection;
}

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running on Netlify Functions',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// API routes
app.use('/api/recipes', recipeRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Initialize database connection before handling requests
const handler = async (event: any, context: any) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('Database connection error:', error);
  }
  
  return serverless(app)(event, context);
};

export { handler };

