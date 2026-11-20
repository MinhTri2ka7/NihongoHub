import { DatabaseService } from './database.service.js';
import type { Database } from './database.types.js';

describe('DatabaseService', () => {
  it('rejects startup when the database cannot be reached', async () => {
    const error = new Error('Connection refused');
    const db = { execute: vi.fn().mockRejectedValue(error) };
    const service = new DatabaseService(db as unknown as Database);
    await expect(service.onModuleInit()).rejects.toBe(error);
  });
});
