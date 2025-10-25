import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Build MongoDB URI with authentication if credentials are provided
const buildMongoURI = (): string => {
  // If custom URI is provided (like MongoDB Atlas), use it directly
  if (process.env['MONGODB_URI'] && process.env['MONGODB_URI'] !== 'mongodb://username:password@localhost:27017/workbench') {
    return process.env['MONGODB_URI'];
  }
  
  // Build URI with individual components for local development
  const host = process.env['MONGODB_HOST'] || 'localhost';
  const port = process.env['MONGODB_PORT'] || '27017';
  const dbName = process.env['MONGODB_DB_NAME'] || 'workbench';
  const username = process.env['MONGODB_USERNAME'];
  const password = process.env['MONGODB_PASSWORD'];
  
  // Build URI with authentication if credentials are provided
  if (username && password) {
    return `mongodb://${username}:${password}@${host}:${port}/${dbName}`;
  }
  
  // Fallback to local connection without auth
  return `mongodb://${host}:${port}/${dbName}`;
};

const MONGODB_URI = buildMongoURI();
const MONGODB_DB_NAME = process.env['MONGODB_DB_NAME'] || 'workbench';

class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('Database already connected');
      return;
    }

    try {
      await mongoose.connect(MONGODB_URI, {
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

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('✅ Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

export default Database;
