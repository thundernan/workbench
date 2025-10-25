"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const buildMongoURI = () => {
    if (process.env['MONGODB_URI'] && process.env['MONGODB_URI'] !== 'mongodb://username:password@localhost:27017/workbench') {
        return process.env['MONGODB_URI'];
    }
    const host = process.env['MONGODB_HOST'] || 'localhost';
    const port = process.env['MONGODB_PORT'] || '27017';
    const dbName = process.env['MONGODB_DB_NAME'] || 'workbench';
    const username = process.env['MONGODB_USERNAME'];
    const password = process.env['MONGODB_PASSWORD'];
    if (username && password) {
        return `mongodb://${username}:${password}@${host}:${port}/${dbName}`;
    }
    return `mongodb://${host}:${port}/${dbName}`;
};
const MONGODB_URI = buildMongoURI();
const MONGODB_DB_NAME = process.env['MONGODB_DB_NAME'] || 'workbench';
class Database {
    constructor() {
        this.isConnected = false;
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    async connect() {
        if (this.isConnected) {
            console.log('Database already connected');
            return;
        }
        try {
            await mongoose_1.default.connect(MONGODB_URI, {
                dbName: MONGODB_DB_NAME,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                bufferCommands: false,
                retryWrites: true,
                w: 'majority'
            });
            this.isConnected = true;
            console.log(`✅ Connected to MongoDB: ${MONGODB_DB_NAME}`);
            mongoose_1.default.connection.on('error', (error) => {
                console.error('❌ MongoDB connection error:', error);
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('disconnected', () => {
                console.log('⚠️ MongoDB disconnected');
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('reconnected', () => {
                console.log('✅ MongoDB reconnected');
                this.isConnected = true;
            });
        }
        catch (error) {
            console.error('❌ Failed to connect to MongoDB:', error);
            this.isConnected = false;
            throw error;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await mongoose_1.default.disconnect();
            this.isConnected = false;
            console.log('✅ Disconnected from MongoDB');
        }
        catch (error) {
            console.error('❌ Error disconnecting from MongoDB:', error);
            throw error;
        }
    }
    getConnectionStatus() {
        return this.isConnected;
    }
    async healthCheck() {
        try {
            if (mongoose_1.default.connection.db) {
                await mongoose_1.default.connection.db.admin().ping();
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Database health check failed:', error);
            return false;
        }
    }
}
exports.default = Database;
//# sourceMappingURL=database.js.map