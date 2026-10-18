import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not set in environment variables.');
    console.log('ℹ️ Attempting in-memory MongoDB fallback for testing / demonstration...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      console.log(`🚀 In-memory MongoDB started at: ${memoryUri}`);
      const conn = await mongoose.connect(memoryUri);
      isConnected = true;
      console.log('✅ Connected to MongoDB (In-Memory Full Binary Server for Demo)');
      return conn;
    } catch (memErr) {
      console.error('❌ Could not start in-memory MongoDB either:', memErr.message);
      throw new Error('MongoDB connection failed. Please provide a valid MONGODB_URI in server/.env');
    }
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });
    isConnected = true;
    console.log(`✅ Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ Primary MongoDB connection failed (${error.message}).`);
    console.log('ℹ️ Attempting in-memory MongoDB fallback so you can demonstrate the project without local mongod setup...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      console.log(`🚀 In-memory MongoDB instance started at: ${memoryUri}`);
      const conn = await mongoose.connect(memoryUri, {
        autoIndex: true
      });
      isConnected = true;
      console.log('✅ Connected to MongoDB (Full MongoDB Binary in-memory mode for Demo)');
      return conn;
    } catch (memErr) {
      console.error('❌ In-memory MongoDB fallback also failed:', memErr.message);
      console.error('👉 Please configure a valid MongoDB Atlas connection string in server/.env:');
      console.error('   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/foodrescue');
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
