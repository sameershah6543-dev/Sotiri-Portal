CREATE TYPE "public"."note_type" AS ENUM('sbl-on', 'sbl-off', 'dbl-on', 'dbl-off', 'note', 'replacement');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('team', 'client');--> statement-breakpoint
CREATE TABLE "domain_flags" (
	"domain" text PRIMARY KEY NOT NULL,
	"sbl" boolean DEFAULT false NOT NULL,
	"dbl" boolean DEFAULT false NOT NULL,
	"original_note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"author" text NOT NULL,
	"type" "note_type" NOT NULL,
	"target" text NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_snapshot" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"campaigns" jsonb NOT NULL,
	"domains" jsonb NOT NULL,
	"unused_profiles" jsonb NOT NULL,
	"account_info" jsonb NOT NULL,
	"last_refreshed" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "replacements" (
	"id" serial PRIMARY KEY NOT NULL,
	"new_domain" text NOT NULL,
	"old_domain" text NOT NULL,
	"client" text NOT NULL,
	"campaign_title" text NOT NULL,
	"campaign_id" text NOT NULL,
	"reason" text NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
