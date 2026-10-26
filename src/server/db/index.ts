import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

export function getDb() {
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not defined in environment variables. Please check your .env configuration.'
    );
  }
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

export type DbClient = ReturnType<typeof getDb>;
export { schema };
