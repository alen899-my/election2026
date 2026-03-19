import { pgTable, uuid, integer, varchar, text, jsonb, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { districts } from './districts';

export const categoryEnum = pgEnum('category', ['general', 'sc', 'st']);

export const constituencies = pgTable('constituencies', {
  id: uuid('id').defaultRandom().primaryKey(),
  districtId: uuid('district_id')
    .references(() => districts.id, { onDelete: 'cascade' })
    .notNull(),
  number: integer('number').notNull().unique(), // 1 to 140
  nameEn: varchar('name_en', { length: 255 }).notNull(),
  nameMl: varchar('name_ml', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  category: categoryEnum('category').default('general').notNull(),
  totalVoters2021: integer('total_voters_2021'),
  totalVoters2026: integer('total_voters_2026'),
  maleVoters: integer('male_voters'),
  femaleVoters: integer('female_voters'),
  geojson: jsonb('geojson'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
});

export type Constituency = typeof constituencies.$inferSelect;
export type NewConstituency = typeof constituencies.$inferInsert;
