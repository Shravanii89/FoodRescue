import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load server/.env regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

let isConnected = false;

/**
 * Connect to MongoDB using MONGODB_URI from server/.env
 * Provides safe diagnostic logging without exposing passwords or secret tokens.
 */
export const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ MONGODB_URI environment variable is not defined.');
      console.error('👉 Please configure MONGODB_URI in your deployment settings (e.g. Render Dashboard > Environment).');
      throw new Error('MONGODB_URI is required in production.');
    }
    console.error('❌ MONGODB_URI is not set in server/.env environment variables.');
    console.log('ℹ️ Attempting in-memory MongoDB fallback for testing / demonstration...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri);
      isConnected = true;
      console.log('✅ Connected to MongoDB (In-Memory Full Binary Instance for Demo)');
      return conn;
    } catch (memErr) {
      console.error('❌ Could not start in-memory MongoDB either:', memErr.message);
      throw new Error('MongoDB connection failed. Please ensure MONGODB_URI is configured in server/.env');
    }
  }

  try {
    const isAtlas = uri.startsWith('mongodb+srv://') || uri.includes('.mongodb.net');
    console.log(`🔌 Attempting connection to ${isAtlas ? 'MongoDB Atlas Cluster' : 'Local MongoDB Service'}...`);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: true
    });
    isConnected = true;
    console.log(`✅ Successfully connected to MongoDB: ${conn.connection.host} (Database: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    // Diagnostic error analysis without leaking credentials or raw URI
    console.warn(`\n⚠️ Primary MongoDB connection attempt encountered an issue:`);
    
    if (error.message?.includes('bad auth') || error.code === 8000 || error.message?.includes('Authentication failed')) {
      console.error('   👉 Cause: Authentication Failed. The database username or password in MONGODB_URI is incorrect or has expired.');
      console.error('      Please verify database users under MongoDB Atlas > Security > Database Access.');
    } else if (error.message?.includes('querySrv ETIMEOUT') || error.message?.includes('ETIMEDOUT') || error.message?.includes('Server selection timed out')) {
      console.error('   👉 Cause: Connection Timeout / Network Access Restriction.');
      console.error('      Ensure 0.0.0.0/0 (or your hosting IP) is allowed in MongoDB Atlas > Security > Network Access.');
    } else if (error.message?.includes('ECONNREFUSED')) {
      console.error('   👉 Cause: Connection Refused. MongoDB service is not reachable at the specified host.');
    } else if (error.message?.includes('Invalid scheme') || error.message?.includes('URI does not start with')) {
      console.error('   👉 Cause: Invalid URI format. Ensure MONGODB_URI begins with "mongodb://" or "mongodb+srv://".');
    } else {
      console.error(`   👉 Cause: ${error.name} - ${error.message}`);
    }

    if (process.env.NODE_ENV === 'production') {
      console.error('\n❌ Production MongoDB connection failed. Terminating process to prevent running with missing storage.');
      throw error;
    }

    console.log('\nℹ️ Falling back to in-memory MongoDB instance to ensure uninterrupted application availability...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri, { autoIndex: true });
      isConnected = true;
      console.log(`✅ Connected to MongoDB (In-Memory Full Binary Server fallback on host: ${conn.connection.host})`);
      return conn;
    } catch (memErr) {
      console.error('❌ In-memory MongoDB fallback also failed:', memErr.message);
      throw error;
    }
  }
};

export const getDBConnectionStatus = () => {
  return {
    isConnected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || 'none',
    name: mongoose.connection.name || 'none'
  };
};

export default connectDB;
