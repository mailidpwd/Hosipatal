import { MongoClient, Db } from 'mongodb';
import { env } from '@hosipatal/env/server';

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Connect to MongoDB
 */
export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (client && db) {
    return { client, db };
  }

  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    client = new MongoClient(env.DATABASE_URL);

    await client.connect();
    console.log('✅ Successfully connected to MongoDB');

    // Extract database name from connection string or use default
    // MongoDB connection string format: mongodb+srv://user:pass@host/dbname?options
    let dbName = 'rdm-health'; // default
    try {
      const url = new URL(env.DATABASE_URL);
      dbName = url.pathname.slice(1) || url.searchParams.get('db') || 'rdm-health';
    } catch (e) {
      // If URL parsing fails, try to extract from connection string manually
      const match = env.DATABASE_URL.match(/\/\/([^\/]+)\/([^?]+)/);
      if (match && match[2]) {
        dbName = match[2];
      }
    }
    db = client.db(dbName);

    // Test the connection
    await db.admin().ping();
    console.log(`✅ Database "${dbName}" is accessible`);

    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Get database instance (must be connected first)
 */
export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return db;
}

/**
 * Close MongoDB connection
 */
export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('✅ MongoDB connection closed');
  }
}

/**
 * Test MongoDB connection
 */
export async function testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    if (!env.DATABASE_URL) {
      return {
        success: false,
        message: 'DATABASE_URL is not set in environment variables. Using in-memory stores.'
      };
    }

    // Add timeout to prevent hanging
    const connectionPromise = connectToDatabase();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('MongoDB connection timeout (5s)')), 5000);
    });

    const { client: _client, db } = await Promise.race([connectionPromise, timeoutPromise]) as { client: MongoClient; db: Db };

    // Get server info
    const adminDb = db.admin();
    const serverStatus = await adminDb.serverStatus();
    const dbStats = await db.stats();

    return {
      success: true,
      message: 'MongoDB connection successful',
      details: {
        database: db.databaseName,
        serverVersion: serverStatus.version,
        collections: dbStats.collections,
        dataSize: `${(dbStats.dataSize / 1024 / 1024).toFixed(2)} MB`,
        storageSize: `${(dbStats.storageSize / 1024 / 1024).toFixed(2)} MB`
      }
    };
  } catch (error: any) {
    const errorMessage = error?.message || String(error) || 'Failed to connect to MongoDB';
    const errorDetails = error?.code ? { code: error.code, name: error.name } : undefined;

    return {
      success: false,
      message: errorMessage + '. Using in-memory stores.',
      details: errorDetails
    };
  }
}

