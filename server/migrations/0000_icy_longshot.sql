DO $$ BEGIN
 CREATE TYPE "category" AS ENUM('general', 'sc', 'st');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "coalition" AS ENUM('LDF', 'UDF', 'NDA', 'IND');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "gender" AS ENUM('male', 'female', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "nomination_status" AS ENUM('pending', 'accepted', 'rejected', 'withdrawn');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "asset_type" AS ENUM('movable', 'immovable');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "live_status" AS ENUM('counting', 'declared', 'leading');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "districts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_en" varchar(255) NOT NULL,
	"name_ml" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"headquarters" varchar(255),
	"constituency_count" integer NOT NULL,
	"geojson_url" varchar(512),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "districts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "constituencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"district_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"name_en" varchar(255) NOT NULL,
	"name_ml" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"category" "category" DEFAULT 'general' NOT NULL,
	"total_voters_2021" integer,
	"total_voters_2026" integer,
	"male_voters" integer,
	"female_voters" integer,
	"geojson" jsonb,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "constituencies_number_unique" UNIQUE("number"),
	CONSTRAINT "constituencies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_en" varchar(255) NOT NULL,
	"name_ml" varchar(255) NOT NULL,
	"abbreviation" varchar(20) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"coalition" "coalition" DEFAULT 'IND' NOT NULL,
	"color_hex" varchar(7),
	"logo_url" varchar(512),
	"founded_year" integer,
	"ideology" varchar(255),
	"website_url" varchar(512),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "parties_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"constituency_id" uuid NOT NULL,
	"party_id" uuid,
	"name_en" varchar(255) NOT NULL,
	"name_ml" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"photo_url" varchar(512),
	"date_of_birth" date,
	"gender" "gender" DEFAULT 'other' NOT NULL,
	"religion" varchar(128),
	"caste" varchar(128),
	"education" varchar(255),
	"profession" varchar(255),
	"is_incumbent" boolean DEFAULT false NOT NULL,
	"terms_served" integer DEFAULT 0 NOT NULL,
	"criminal_cases" integer DEFAULT 0 NOT NULL,
	"total_assets_inr" bigint DEFAULT 0 NOT NULL,
	"total_liabilities_inr" bigint DEFAULT 0 NOT NULL,
	"affidavit_url" varchar(512),
	"bio" text,
	"social_facebook" varchar(512),
	"social_twitter" varchar(512),
	"social_instagram" varchar(512),
	"election_year" integer DEFAULT 2026 NOT NULL,
	"nomination_status" "nomination_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "candidates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "election_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"constituency_id" uuid NOT NULL,
	"candidate_id" uuid,
	"party_id" uuid,
	"election_year" integer NOT NULL,
	"candidate_name" varchar(255) NOT NULL,
	"votes_received" integer,
	"vote_percentage" numeric(5, 2),
	"position" integer,
	"is_winner" boolean DEFAULT false NOT NULL,
	"winning_margin" integer,
	"total_votes_polled" integer,
	"voter_turnout_pct" numeric(5, 2),
	"nota_votes" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "candidate_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"asset_type" "asset_type" NOT NULL,
	"description" text NOT NULL,
	"value_inr" bigint NOT NULL,
	"source" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "criminal_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"case_number" varchar(255) NOT NULL,
	"section" text NOT NULL,
	"court" varchar(255) NOT NULL,
	"status" varchar(255) NOT NULL,
	"is_serious" boolean DEFAULT false NOT NULL,
	"year" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "live_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"constituency_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"votes_so_far" integer DEFAULT 0 NOT NULL,
	"rounds_counted" integer DEFAULT 0 NOT NULL,
	"total_rounds" integer DEFAULT 0,
	"is_leading" boolean DEFAULT false NOT NULL,
	"lead_margin" integer DEFAULT 0,
	"status" "live_status" DEFAULT 'counting' NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "constituencies" ADD CONSTRAINT "constituencies_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidates" ADD CONSTRAINT "candidates_constituency_id_constituencies_id_fk" FOREIGN KEY ("constituency_id") REFERENCES "constituencies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidates" ADD CONSTRAINT "candidates_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "election_results" ADD CONSTRAINT "election_results_constituency_id_constituencies_id_fk" FOREIGN KEY ("constituency_id") REFERENCES "constituencies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "election_results" ADD CONSTRAINT "election_results_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "election_results" ADD CONSTRAINT "election_results_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "parties"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_assets" ADD CONSTRAINT "candidate_assets_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "criminal_cases" ADD CONSTRAINT "criminal_cases_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "live_results" ADD CONSTRAINT "live_results_constituency_id_constituencies_id_fk" FOREIGN KEY ("constituency_id") REFERENCES "constituencies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "live_results" ADD CONSTRAINT "live_results_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
