import {
  pgTable,
  text,
  boolean,
  timestamp,
  jsonb,
  serial,
  integer,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["team", "client"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Singleton row (id is always 1), overwritten wholesale on every /api/refresh pull.
export const platformSnapshot = pgTable("platform_snapshot", {
  id: integer("id").primaryKey().default(1),
  campaigns: jsonb("campaigns").notNull(),
  domains: jsonb("domains").notNull(),
  unusedProfiles: jsonb("unused_profiles").notNull(),
  accountInfo: jsonb("account_info").notNull(),
  lastRefreshed: timestamp("last_refreshed", { withTimezone: true }).notNull(),
});

// Manual, per-domain flags. Survives every refresh.
export const domainFlags = pgTable("domain_flags", {
  domain: text("domain").primaryKey(),
  sbl: boolean("sbl").notNull().default(false),
  dbl: boolean("dbl").notNull().default(false),
  // The MCC platform API has no renewal/auto-renew field at all (confirmed
  // against a live pull) — this is entirely team-tracked: true once someone
  // has renewed/confirmed renewal for this domain, cleared automatically
  // once past the old expiry date so it doesn't stay stale forever.
  renewMarked: boolean("renew_marked").notNull().default(false),
  originalNote: text("original_note"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Manual replacement log. Survives every refresh.
export const replacements = pgTable("replacements", {
  id: serial("id").primaryKey(),
  newDomain: text("new_domain").notNull(),
  oldDomain: text("old_domain").notNull(),
  client: text("client").notNull(),
  campaignTitle: text("campaign_title").notNull(),
  campaignId: text("campaign_id").notNull(),
  reason: text("reason").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const noteTypeEnum = pgEnum("note_type", [
  "sbl-on",
  "sbl-off",
  "dbl-on",
  "dbl-off",
  "renewal-marked",
  "renewal-unmarked",
  "note",
  "replacement",
]);

// Append-only audit trail. Survives every refresh.
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
  author: text("author").notNull(),
  type: noteTypeEnum("type").notNull(),
  target: text("target").notNull(),
  text: text("text").notNull(),
});
