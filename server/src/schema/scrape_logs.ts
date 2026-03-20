import { pgTable, uuid, varchar, integer, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const scrapeStatusEnum = pgEnum('scrape_status', ['success', 'partial', 'failed']);

export const scrapeLogs = pgTable('scrape_logs', {
  id:              uuid('id').defaultRandom().primaryKey(),
  sourceUrl:       varchar('source_url', { length: 512 }).notNull(),
  scrapeType:      varchar('scrape_type', { length: 100 }).notNull(),
  status:          scrapeStatusEnum('status').notNull().default('success'),
  recordsInserted: integer('records_inserted').default(0),
  recordsUpdated:  integer('records_updated').default(0),
  recordsSkipped:  integer('records_skipped').default(0),
  errorMessage:    text('error_message'),
  durationMs:      integer('duration_ms'),
  triggeredBy:     varchar('triggered_by', { length: 100 }).default('api'),
  createdAt:       timestamp('created_at').defaultNow().notNull(),
});

export type ScrapeLog    = typeof scrapeLogs.$inferSelect;
export type NewScrapeLog = typeof scrapeLogs.$inferInsert;