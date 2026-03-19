import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const districts = pgTable('districts', {
  id: uuid('id').defaultRandom().primaryKey(),
  nameEn: varchar('name_en', { length: 255 }).notNull(),
  nameMl: varchar('name_ml', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  headquarters: varchar('headquarters', { length: 255 }),
  constituencyCount: integer('constituency_count').notNull(),
  geojsonUrl: varchar('geojson_url', { length: 512 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export type District = typeof districts.$inferSelect;
export type NewDistrict = typeof districts.$inferInsert;
