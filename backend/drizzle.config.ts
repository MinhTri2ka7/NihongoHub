import { defineConfig } from 'drizzle-kit';
import { envConfig } from './src/config/env.config.js';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infrastructure/database/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: envConfig.database.url },
});
