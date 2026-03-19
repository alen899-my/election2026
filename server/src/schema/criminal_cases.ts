import { pgTable, uuid, integer, varchar, text, boolean } from 'drizzle-orm/pg-core';
import { candidates } from './candidates';

export const criminalCases = pgTable('criminal_cases', {
  id: uuid('id').defaultRandom().primaryKey(),
  candidateId: uuid('candidate_id')
    .references(() => candidates.id, { onDelete: 'cascade' })
    .notNull(),
  
  caseNumber: varchar('case_number', { length: 255 }).notNull(),
  section: text('section').notNull(),
  court: varchar('court', { length: 255 }).notNull(),
  status: varchar('status', { length: 255 }).notNull(),
  
  isSerious: boolean('is_serious').default(false).notNull(),
  year: integer('year')
});

export type CriminalCase = typeof criminalCases.$inferSelect;
export type NewCriminalCase = typeof criminalCases.$inferInsert;
