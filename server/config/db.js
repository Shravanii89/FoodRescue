import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';
import dns from 'dns';

// Fix for Windows / VPN environments where local loopback resolver (127.0.0.1) rejects SRV lookups
try {
  const currentServers = dns.getServers();
  if (currentServers.length === 1 && currentServers[0] === '127.0.0.1') {
    dns.setServers(['8.8.8.8', '1.1.1.1', '127.0.0.1']);
  }
} catch {
  // Ignore DNS config errors
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load server/.env regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

let isConnected = false;
let isInMemory = false;
let connectionPromise = null;

const checkTcpPort = (host, port, timeoutMs = 300) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isResolved = false;

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve(true);
      }
    });

    const onErrorOrTimeout = () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve(false);
      }
    };

    socket.once('timeout', onErrorOrTimeout);
    socket.once('error', onErrorOrTimeout);
    socket.connect(port, host);
  });
};

const internalConnect = async () => {
  const rawUri = process.env.MONGODB_URI;
  const uri = rawUri ? rawUri.trim().replace(/^["']|["']$/g, '') : null;

  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ MONGODB_URI environment variable is not defined.');
      console.error('👉 Please configure MONGODB_URI in your deployment settings (e.g. Render Dashboard > Environment).');
      throw new Error('MONGODB_URI is required in production.');
    }
    console.log('ℹ️ MONGODB_URI is not set. Launching in-memory MongoDB instance for development...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();
    const conn = await mongoose.connect(memoryUri, { autoIndex: true });
    isConnected = true;
    isInMemory = true;
    console.log(`✅ Connected to MongoDB (In-Memory Database Server active on host: ${conn.connection.host})`);
    return conn;
  }

  if (uri.includes('<') || uri.includes('>')) {
    console.warn(`\n⚠️ Notice: MONGODB_URI in server/.env still contains placeholder angle brackets (< or >).`);
    console.warn(`   👉 Atlas requires your real database username and password in place of <db_username> and <db_password>.\n`);
  }

  const isAtlas = uri.startsWith('mongodb+srv://') || uri.includes('.mongodb.net');

  // For local development URI, check if local mongod is listening before attempting
  if (!isAtlas && process.env.NODE_ENV !== 'production') {
    const isPortOpen = await checkTcpPort('127.0.0.1', 27017, 300);
    if (!isPortOpen) {
      console.log('ℹ️ Local MongoDB daemon (port 27017) is not running.');
      console.log('⚡ Launching high-performance in-memory MongoDB instance for development...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memoryUri = mongod.getUri();
        const conn = await mongoose.connect(memoryUri, { autoIndex: true });
        isConnected = true;
        isInMemory = true;
        console.log(`✅ Connected to MongoDB (In-Memory Database Server active on host: ${conn.connection.host})`);
        return conn;
      } catch (memErr) {
        console.error('❌ In-memory MongoDB fallback failed:', memErr.message);
      }
    }
  }

  try {
    console.log(`🔌 Attempting connection to ${isAtlas ? 'MongoDB Atlas Cluster' : 'Local MongoDB Service'}...`);

    const conn = await mongoose.connect(uri, {
      dbName: 'foodrescue',
      serverSelectionTimeoutMS: process.env.NODE_ENV === 'production' ? 10000 : 2500,
      autoIndex: true
    });
    isConnected = true;
    isInMemory = false;
    console.log(`✅ Successfully connected to MongoDB: ${conn.connection.host} (Database: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.warn(`\n⚠️ Primary MongoDB connection attempt encountered an issue:`);
    
    if (error.message?.includes('bad auth') || error.code === 8000 || error.message?.includes('Authentication failed')) {
      console.error('   👉 Cause: Authentication Failed. The database username or password in MONGODB_URI is incorrect or has expired.');
      console.error('      Check that <db_username> and <db_password> in server/.env are replaced with your actual database credentials.');
    } else if (error.message?.includes('querySrv ECONNREFUSED')) {
      console.error('   👉 Cause: DNS SRV Resolution Refused. Local DNS could not resolve the Atlas cluster SRV record.');
    } else if (error.message?.includes('querySrv ETIMEOUT') || error.message?.includes('ETIMEDOUT') || error.message?.includes('Server selection timed out')) {
      console.error('   👉 Cause: Connection Timeout / Network Access Restriction.');
      console.error('      Ensure 0.0.0.0/0 (or your hosting IP) is allowed in MongoDB Atlas > Security > Network Access.');
    } else if (error.message?.includes('ECONNREFUSED')) {
      console.error('   👉 Cause: Connection Refused. MongoDB service is not reachable at the specified host.');
    } else {
      console.error(`   👉 Cause: ${error.name} - ${error.message}`);
    }

    if (process.env.NODE_ENV === 'production') {
      console.error('\n❌ Production MongoDB connection failed. Terminating process.');
      throw error;
    }

    console.log('\nℹ️ Falling back to in-memory MongoDB instance to ensure uninterrupted availability...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();
    const conn = await mongoose.connect(memoryUri, { autoIndex: true });
    isConnected = true;
    isInMemory = true;
    console.log(`✅ Connected to MongoDB (In-Memory Server fallback on host: ${conn.connection.host})`);
    return conn;
  }
};

/**
 * Connect to MongoDB using connection mutex promise to prevent concurrent openUri collisions
 */
export const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = internalConnect().catch((err) => {
    connectionPromise = null;
    isConnected = false;
    throw err;
  });

  return connectionPromise;
};

export const getDBConnectionStatus = () => {
  const isConn = mongoose.connection.readyState === 1;
  return {
    isConnected: isConn,
    readyState: mongoose.connection.readyState,
    persistence: isInMemory ? 'in-memory (ephemeral fallback)' : 'persistent (MongoDB Atlas / Server)',
    isInMemory,
    host: mongoose.connection.host || 'none',
    name: mongoose.connection.name || 'none'
  };
};

export default connectDB;
