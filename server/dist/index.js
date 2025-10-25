"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const database_1 = __importDefault(require("./config/database"));
const recipeRoutes_1 = __importDefault(require("./routes/recipeRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const swagger_1 = require("./config/swagger");
const blockchainListener_1 = require("./services/blockchainListener");
const contract_1 = require("./config/contract");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env['PORT'] || 3001;
const database = database_1.default.getInstance();
app.use((0, helmet_1.default)());
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3001',
            'http://localhost:3007',
            'http://127.0.0.1:3007',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            process.env['CORS_ORIGIN'] || ''
        ].filter(Boolean);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
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
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'),
    max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);
if (process.env['NODE_ENV'] === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
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
app.use('/api/recipes', recipeRoutes_1.default);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Workbench API Documentation'
}));
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
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
const startServer = async () => {
    try {
        await database.connect();
        const rpcUrl = process.env['BLOCKCHAIN_RPC_URL'];
        const contractAddress = process.env['WORKBENCH_CONTRACT_ADDRESS'];
        let blockchainListener = null;
        if (rpcUrl && contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000') {
            try {
                blockchainListener = new blockchainListener_1.BlockchainListener(rpcUrl, contractAddress, contract_1.WORKBENCH_CONTRACT_ABI);
                await blockchainListener.startListening();
                console.log('🔗 Blockchain listener initialized successfully');
            }
            catch (error) {
                console.warn('⚠️  Failed to initialize blockchain listener:', error);
                console.log('📝 Server will continue without blockchain integration');
            }
        }
        else {
            console.log('📝 Blockchain configuration not provided, running in database-only mode');
        }
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
            console.log(`🔗 API Base URL: http://localhost:${PORT}`);
            console.log(`📋 Health Check: http://localhost:${PORT}/health`);
            console.log(`🧪 Recipes API: http://localhost:${PORT}/api/recipes`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
            if (blockchainListener?.isActive()) {
                console.log(`⛓️  Blockchain Listener: Active (${blockchainListener.getContractAddress()})`);
            }
            else {
                console.log(`⛓️  Blockchain Listener: Inactive`);
            }
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
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
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});
exports.default = app;
if (require.main === module) {
    startServer();
}
//# sourceMappingURL=index.js.map