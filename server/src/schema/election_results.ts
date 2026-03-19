import { pgTable, uuid, integer, varchar, decimal, boolean, timestamp } from 'drizzle-orm/pg-core';
import { constituencies } from './constituencies';
import { parties } from './parties';
import { candidates } from './candidates';

export const electionResults = pgTable('election_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  constituencyId: uuid('constituency_id')
    .references(() => constituencies.id, { onDelete: 'cascade' })
    .notNull(),
  candidateId: uuid('candidate_id')
    .references(() => candidates.id, { onDelete: 'set null' }),
  partyId: uuid('party_id')
    .references(() => parties.id, { onDelete: 'set null' }),
  
  electionYear: integer('election_year').notNull(),
  candidateName: varchar('candidate_name', { length: 255 }).notNull(),
  
  votesReceived: integer('votes_received'),
  votePercentage: decimal('vote_percentage', { precision: 5, scale: 2 }),
  position: integer('position'),
  
  isWinner: boolean('is_winner').default(false).notNull(),
  winningMargin: integer('winning_margin'),
  
  totalVotesPolled: integer('total_votes_polled'),
  voterTurnoutPct: decimal('voter_turnout_pct', { precision: 5, scale: 2 }),
  notaVotes: integer('nota_votes'),
  
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export type ElectionResult = typeof electionResults.$inferSelect;
export type NewElectionResult = typeof electionResults.$inferInsert;
