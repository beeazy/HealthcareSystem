import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';
import { config } from 'dotenv';

config();

// Setup PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // from Supabase
  });
  
  export const db = drizzle(pool, { schema });

// Test database connection with retry logic
async function testConnection(retries = 3): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect();
      console.log('Successfully connected to database');
      client.release();
      return;
    } catch (err) {
      console.error(`Database connection attempt ${attempt} failed:`, err);
      if (attempt === retries) {
        console.error('Failed to connect to database after 3 attempts');
        return;
      }
      // Wait 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

testConnection();