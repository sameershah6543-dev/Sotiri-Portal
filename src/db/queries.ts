import { desc, eq, sql } from "drizzle-orm";
import { db } from "./client";
import { domainFlags, notes, platformSnapshot, replacements, users } from "./schema";
import type {
  AccountInfo,
  DomainFlag,
  Note,
  NoteType,
  PlatformCampaign,
  PlatformDomain,
  Replacement,
  Role,
  UnusedProfile,
  ViewCampaign,
  ViewDomain,
} from "@/types";
import { clientFromTitle, daysLeft, hasProfileMismatch } from "@/lib/derive";

export type MergedState = {
  lastRefreshed: string | null;
  campaigns: ViewCampaign[];
  domains: ViewDomain[];
  unusedProfiles: UnusedProfile[];
  accountInfo: AccountInfo | null;
  replacements: Replacement[];
  notes: Note[];
};

export async function getMergedState(): Promise<MergedState> {
  const [snapshot] = await db.select().from(platformSnapshot).limit(1);
  const flagRows = await db.select().from(domainFlags);
  const replacementRows = await db
    .select()
    .from(replacements)
    .orderBy(desc(replacements.date), desc(replacements.id));
  const noteRows = await db.select().from(notes).orderBy(desc(notes.ts), desc(notes.id));

  const flagsByDomain = new Map<string, DomainFlag>(
    flagRows.map((r) => [
      r.domain,
      { domain: r.domain, sbl: r.sbl, dbl: r.dbl, originalNote: r.originalNote },
    ]),
  );
  const newDomains = new Set(replacementRows.map((r) => r.newDomain));

  const platformCampaigns = (snapshot?.campaigns as PlatformCampaign[] | undefined) ?? [];
  const platformDomains = (snapshot?.domains as PlatformDomain[] | undefined) ?? [];

  const domainsByName = new Map(platformDomains.map((d) => [d.domain, d]));

  const viewCampaigns: ViewCampaign[] = platformCampaigns.map((c) => {
    const flag = flagsByDomain.get(c.domain);
    return {
      ...c,
      client: clientFromTitle(c.title),
      sbl: flag?.sbl ?? false,
      isNewDomain: newDomains.has(c.domain),
      profileMismatch: hasProfileMismatch(c),
    };
  });

  const viewDomains: ViewDomain[] = platformDomains.map((d) => {
    const flag = flagsByDomain.get(d.domain);
    return {
      ...d,
      daysLeft: daysLeft(d.expireDate),
      sbl: flag?.sbl ?? false,
      dbl: flag?.dbl ?? false,
      originalNote: flag?.originalNote ?? null,
      isNewDomain: newDomains.has(d.domain),
    };
  });

  return {
    lastRefreshed: snapshot?.lastRefreshed?.toISOString() ?? null,
    campaigns: viewCampaigns,
    domains: viewDomains,
    unusedProfiles: (snapshot?.unusedProfiles as UnusedProfile[] | undefined) ?? [],
    accountInfo: (snapshot?.accountInfo as AccountInfo | undefined) ?? null,
    replacements: replacementRows.map((r) => ({
      id: r.id,
      newDomain: r.newDomain,
      oldDomain: r.oldDomain,
      client: r.client,
      campaignTitle: r.campaignTitle,
      campaignId: r.campaignId,
      reason: r.reason,
      date: r.date,
    })),
    notes: noteRows.map((n) => ({
      id: n.id,
      ts: n.ts.toISOString(),
      author: n.author,
      type: n.type,
      target: n.target,
      text: n.text,
    })),
  };
}

async function addNote(author: string, type: NoteType, target: string, text: string) {
  await db.insert(notes).values({ author, type, target, text });
}

export async function setDomainFlag(params: {
  domain: string;
  field: "sbl" | "dbl";
  value: boolean;
  author: string;
  note?: string;
}) {
  const { domain, field, value, author, note } = params;

  await db
    .insert(domainFlags)
    .values({ domain, [field]: value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: domainFlags.domain,
      set: { [field]: value, updatedAt: new Date() },
    });

  const type: NoteType = `${field}-${value ? "on" : "off"}` as NoteType;
  await addNote(author, type, domain, note?.trim() || `${field.toUpperCase()} ${value ? "flagged" : "cleared"}`);
}

export async function addDomainNote(params: { domain: string; author: string; text: string }) {
  await addNote(params.author, "note", params.domain, params.text);
}

export async function logReplacement(params: {
  newDomain: string;
  oldDomain: string;
  client: string;
  campaignTitle: string;
  campaignId: string;
  reason: string;
  date: string;
  author: string;
}) {
  const { author, ...row } = params;
  await db.insert(replacements).values(row);
  await addNote(author, "replacement", `${row.oldDomain} → ${row.newDomain}`, row.reason);
}

export async function upsertSnapshot(params: {
  campaigns: PlatformCampaign[];
  domains: PlatformDomain[];
  unusedProfiles: UnusedProfile[];
  accountInfo: AccountInfo;
}) {
  await db
    .insert(platformSnapshot)
    .values({ id: 1, ...params, lastRefreshed: new Date() })
    .onConflictDoUpdate({
      target: platformSnapshot.id,
      set: { ...params, lastRefreshed: new Date() },
    });
}

export async function listUsers() {
  return db
    .select({ id: users.id, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users)
    .orderBy(users.email);
}

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user;
}

export async function createUser(params: { email: string; passwordHash: string; role: Role }) {
  const [user] = await db
    .insert(users)
    .values(params)
    .returning({ id: users.id, email: users.email, role: users.role });
  return user;
}

export async function deleteUser(id: number) {
  await db.delete(users).where(eq(users.id, id));
}

export async function updateUserRole(id: number, role: Role) {
  await db.update(users).set({ role }).where(eq(users.id, id));
}

export async function setUserPassword(id: number, passwordHash: string) {
  await db.update(users).set({ passwordHash }).where(eq(users.id, id));
}

export async function countUsers(): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  return row?.count ?? 0;
}

export async function countUsersByRole(role: Role): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.role, role));
  return row?.count ?? 0;
}

export async function getUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}
