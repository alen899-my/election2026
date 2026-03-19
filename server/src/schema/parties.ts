import { pgTable, uuid, varchar, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const coalitionEnum = pgEnum('coalition', ['LDF', 'UDF', 'NDA', 'IND']);

export const parties = pgTable('parties', {
  id: uuid('id').defaultRandom().primaryKey(),
  nameEn: varchar('name_en', { length: 255 }).notNull(),
  nameMl: varchar('name_ml', { length: 255 }).notNull(),
  abbreviation: varchar('abbreviation', { length: 20 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  coalition: coalitionEnum('coalition').default('IND').notNull(),
  colorHex: varchar('color_hex', { length: 7 }),
  logoUrl: varchar('logo_url', { length: 512 }),
  foundedYear: integer('founded_year'),
  ideology: varchar('ideology', { length: 255 }),
  websiteUrl: varchar('website_url', { length: 512 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export type Party = typeof parties.$inferSelect;
export type NewParty = typeof parties.$inferInsert;
