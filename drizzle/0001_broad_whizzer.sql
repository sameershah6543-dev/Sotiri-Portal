ALTER TYPE "public"."note_type" ADD VALUE 'renewal-marked' BEFORE 'note';--> statement-breakpoint
ALTER TYPE "public"."note_type" ADD VALUE 'renewal-unmarked' BEFORE 'note';--> statement-breakpoint
ALTER TABLE "domain_flags" ADD COLUMN "renew_marked" boolean DEFAULT false NOT NULL;