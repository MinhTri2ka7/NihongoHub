import { defineConfig } from 'drizzle-kit';
import { loadEnvironment } from './src/config/env.loader.js';
import { validateDatabaseEnv } from './src/config/database.config.js';

const database = validateDatabaseEnv(loadEnvironment());

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infrastructure/database/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: database.DATABASE_URL },
});
