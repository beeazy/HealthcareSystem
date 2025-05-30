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

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Successfully connected to database');
    release();
}); 