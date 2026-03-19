import { pgTable, uuid, varchar, text, bigint, pgEnum } from 'drizzle-orm/pg-core';
import { candidates } from './candidates';

export const assetTypeEnum = pgEnum('asset_type', ['movable', 'immovable']);

export const candidateAssets = pgTable('candidate_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  candidateId: uuid('candidate_id')
    .references(() => candidates.id, { onDelete: 'cascade' })
    .notNull(),
  
  assetType: assetTypeEnum('asset_type').notNull(),
  description: text('description').notNull(),
  valueInr: bigint('value_inr', { mode: 'number' }).notNull(),
  source: varchar('source', { length: 255 })
});

export type CandidateAsset = typeof candidateAssets.$inferSelect;
export type NewCandidateAsset = typeof candidateAssets.$inferInsert;
