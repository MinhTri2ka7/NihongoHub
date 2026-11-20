import { defineRelations } from 'drizzle-orm';
import * as schema from './schema/index.js';

// Add relational query definitions when tables are introduced.
export const relations = defineRelations(schema);
