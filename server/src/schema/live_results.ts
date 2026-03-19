import { pgTable, uuid, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { constituencies } from './constituencies';
import { candidates } from './candidates';

export const liveStatusEnum = pgEnum('live_status', ['counting', 'declared', 'leading']);

export const liveResults = pgTable('live_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  constituencyId: uuid('constituency_id')
    .references(() => constituencies.id, { onDelete: 'cascade' })
    .notNull(),
  candidateId: uuid('candidate_id')
    .references(() => candidates.id, { onDelete: 'cascade' })
    .notNull(),
  
  votesSoFar: integer('votes_so_far').default(0).notNull(),
  roundsCounted: integer('rounds_counted').default(0).notNull(),
  totalRounds: integer('total_rounds').default(0),
  
  isLeading: boolean('is_leading').default(false).notNull(),
  leadMargin: integer('lead_margin').default(0),
  
  status: liveStatusEnum('status').default('counting').notNull(),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull()
});

export type LiveResult = typeof liveResults.$inferSelect;
export type NewLiveResult = typeof liveResults.$inferInsert;
