import { pgTable, uuid, varchar, integer, bigint, boolean, text, date, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { constituencies } from './constituencies';
import { parties } from './parties';

export const genderEnum = pgEnum('gender', ['male', 'female', 'other']);
export const nominationEnum = pgEnum('nomination_status', ['pending', 'accepted', 'rejected', 'withdrawn']);

export const candidates = pgTable('candidates', {
  id: uuid('id').defaultRandom().primaryKey(),
  constituencyId: uuid('constituency_id')
    .references(() => constituencies.id, { onDelete: 'cascade' })
    .notNull(),
  partyId: uuid('party_id')
    .references(() => parties.id, { onDelete: 'set null' }),
  
  nameEn: varchar('name_en', { length: 255 }).notNull(),
  nameMl: varchar('name_ml', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  photoUrl: varchar('photo_url', { length: 512 }),
  
  dateOfBirth: date('date_of_birth'),
  gender: genderEnum('gender').default('other').notNull(),
  religion: varchar('religion', { length: 128 }),
  caste: varchar('caste', { length: 128 }),
  education: varchar('education', { length: 255 }),
  profession: varchar('profession', { length: 255 }),
  
  isIncumbent: boolean('is_incumbent').default(false).notNull(),
  termsServed: integer('terms_served').default(0).notNull(),
  criminalCases: integer('criminal_cases').default(0).notNull(),
  
  totalAssetsInr: bigint('total_assets_inr', { mode: 'number' }).default(0).notNull(),
  totalLiabilitiesInr: bigint('total_liabilities_inr', { mode: 'number' }).default(0).notNull(),
  affidavitUrl: varchar('affidavit_url', { length: 512 }),
  
  bio: text('bio'),
  socialFacebook: varchar('social_facebook', { length: 512 }),
  socialTwitter: varchar('social_twitter', { length: 512 }),
  socialInstagram: varchar('social_instagram', { length: 512 }),
  
  electionYear: integer('election_year').default(2026).notNull(),
  nominationStatus: nominationEnum('nomination_status').default('pending').notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
});

export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;
