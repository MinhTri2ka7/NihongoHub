import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { EnvConfigModule } from '../../config/env-config.module.js';
import { EnvConfigService } from '../../config/env-config.service.js';
import { DatabaseService } from './database.service.js';
import { relations } from './relations.js';

@Module({
  imports: [
    DrizzleModule.forRootAsync<typeof drizzle>({
      imports: [EnvConfigModule],
      inject: [EnvConfigService],
      useFactory: (envConfig: EnvConfigService) => {
        const database = envConfig.database;
        return {
          drizzle,
          connection: {
            connectionString: database.url,
            max: database.poolMax,
            connectionTimeoutMillis: database.connectTimeoutMs,
            idleTimeoutMillis: database.idleTimeoutMs,
            statement_timeout: database.queryTimeoutMs,
            query_timeout: database.queryTimeoutMs,
          },
          relations,
          autoCloseConnection: true,
        };
      },
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
