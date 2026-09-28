import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

const connectionString = process.env.DATABASE_URL;

let dbInstance: any = null;
let poolInstance: Pool | null = null;

if (connectionString) {
  try {
    poolInstance = new Pool({
      connectionString,
      ssl: false,
    });
    dbInstance = drizzle(poolInstance, { schema });
    console.log('Connected to PostgreSQL successfully.');
  } catch (err) {
    console.error('Failed to connect to PostgreSQL:', err);
  }
}

export const db = dbInstance;
export const pool = poolInstance;
export { schema };
