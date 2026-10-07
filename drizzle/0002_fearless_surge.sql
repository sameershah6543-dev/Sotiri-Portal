CREATE TYPE "public"."request_status" AS ENUM('open', 'in_progress', 'done');--> statement-breakpoint
CREATE TYPE "public"."request_type" AS ENUM('new_domain', 'remove_domain', 'other');--> statement-breakpoint
ALTER TYPE "public"."note_type" ADD VALUE 'request-new';--> statement-breakpoint
ALTER TYPE "public"."note_type" ADD VALUE 'request-status';--> statement-breakpoint
CREATE TABLE "requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "request_type" DEFAULT 'other' NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"requested_by" text NOT NULL,
	"status" "request_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
