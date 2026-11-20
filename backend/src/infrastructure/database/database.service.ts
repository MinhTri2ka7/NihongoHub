import { Injectable, Logger } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { sql } from 'drizzle-orm';
import type { Database } from './database.types.js';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@InjectDrizzle() private readonly db: Database) {}

  async onModuleInit(): Promise<void> {
    await this.ping();
    this.logger.log('Database connection established');
  }

  async ping(): Promise<void> {
    await this.db.execute(sql`SELECT 1`);
  }
}
