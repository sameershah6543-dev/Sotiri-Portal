# MCC Sending Manifest Portal

A command center for MailClickConvert's email-sending operations: campaigns, sending domains,
expiry/blacklist flags, and a replacement log, refreshed automatically from the platform API and
deployed on Vercel. Full background/spec: [`docs/MCC_PORTAL_CONTEXT.md`](docs/MCC_PORTAL_CONTEXT.md).

## Stack

Next.js (App Router) + TypeScript + Tailwind, Auth.js (email/password), Postgres via Drizzle ORM,
Vercel Cron for the scheduled platform refresh.

## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in DATABASE_URL and AUTH_SECRET at minimum
npm run db:migrate                  # create the tables
npm run db:seed                     # load the brief's Appendix A snapshot as first-run data
npm run db:seed-admin                # create your first team (edit) login
npm run dev
```

Log in with `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD`, then use **Admin** in the nav to add
everyone else (team = edit, client = view-only).

## Connecting to the real platform

`/api/refresh` (called once daily by Vercel Cron, see `vercel.json`) pulls fresh data from the
MCC platform API and safely does nothing until `MCC_API_BASE_URL` and `MCC_API_KEY` are set — get
those from the platform's own dashboard (see `docs/MCC_PORTAL_CONTEXT.md` §4). The manually-entered
data (SBL/DBL flags, notes, the replacement log) is never touched by a refresh.

Vercel's Hobby plan caps Cron Jobs at once per day — the brief suggested every 4–6 hours, but that
needs a Pro plan. Bump the schedule in `vercel.json` (and redeploy) if you upgrade later.

## Deploying

1. Push this repo to GitHub, import it into a new Vercel project.
2. Add a Postgres database (Vercel Postgres / Neon integration) to the project — this sets
   `DATABASE_URL`/`POSTGRES_URL` for you.
3. In Project Settings → Environment Variables, add: `AUTH_SECRET` (`npx auth secret`),
   `CRON_SECRET` (any random string), `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD`, and — once
   you have them — `MCC_API_BASE_URL` / `MCC_API_KEY`.
4. Run `npm run db:migrate` and `npm run db:seed` and `npm run db:seed-admin` once, pointed at the
   production `DATABASE_URL` (e.g. `DATABASE_URL=... npm run db:migrate` locally, or via Vercel CLI
   `vercel env pull` first).
5. Deploy. Confirm the cron entry shows up under the project's **Cron Jobs** tab.
