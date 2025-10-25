import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';

import Database from './config/database';
import recipeRoutes from './routes/recipeRoutes';
import { errorHandler, notFound } from './middleware/errorHandler';
import { specs } from './config/swagger';
import { BlockchainListener } from './services/blockchainListener';
import { WORKBENCH_CONTRACT_ABI } from './config/contract';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3001;

// Initialize database
const database = Database.getInstance();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001', // Server itself
      'http://127.0.0.1:3001',
      'http://localhost:3007', // Additional client port
      'http://127.0.0.1:3007',
      'http://localhost:5173', // Vite default port
      'http://127.0.0.1:5173',
      'https://craft-hack.netlify.app', // Production frontend
      process.env['CORS_ORIGIN'] || ''
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Logging middleware
if (process.env['NODE_ENV'] === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Server is healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 database:
 *                   type: string
 *                   example: "connected"
 *       503:
 *         description: Server is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Server is unhealthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 database:
 *                   type: string
 *                   example: "disconnected"
 */
app.get('/health', async (_req, res) => {
  const dbHealth = await database.healthCheck();
  
  res.status(dbHealth ? 200 : 503).json({
    success: dbHealth,
    message: dbHealth ? 'Server is healthy' : 'Server is unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealth ? 'connected' : 'disconnected'
  });
});

// API routes
app.use('/api/recipes', recipeRoutes);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Workbench API Documentation'
}));

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Workbench Server API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      recipes: '/api/recipes',
      documentation: '/api-docs'
    }
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await database.connect();
    
    // Initialize blockchain listener
    const rpcUrl = process.env['BLOCKCHAIN_RPC_URL'];
    const contractAddress = process.env['WORKBENCH_CONTRACT_ADDRESS'];
    
    let blockchainListener: BlockchainListener | null = null;
    
    if (rpcUrl && contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000') {
      try {
        blockchainListener = new BlockchainListener(rpcUrl, contractAddress, WORKBENCH_CONTRACT_ABI);
        await blockchainListener.startListening();
        console.log('🔗 Blockchain listener initialized successfully');
      } catch (error) {
        console.warn('⚠️  Failed to initialize blockchain listener:', error);
        console.log('📝 Server will continue without blockchain integration');
      }
    } else {
      console.log('📝 Blockchain configuration not provided, running in database-only mode');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}`);
      console.log(`📋 Health Check: http://localhost:${PORT}/health`);
      console.log(`🧪 Recipes API: http://localhost:${PORT}/api/recipes`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      if (blockchainListener?.isActive()) {
        console.log(`⛓️  Blockchain Listener: Active (${blockchainListener.getContractAddress()})`);
      } else {
        console.log(`⛓️  Blockchain Listener: Inactive`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await database.disconnect();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

export default app;

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}
