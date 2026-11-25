import { defineRelations } from 'drizzle-orm';
import * as schema from './schema/index.js';

export const relations = defineRelations(schema, (relation) => ({
  users: {
    refreshTokens: relation.many.refreshTokens(),
  },
  refreshTokens: {
    user: relation.one.users({
      from: relation.refreshTokens.userId,
      to: relation.users.id,
      optional: false,
    }),
  },
}));
