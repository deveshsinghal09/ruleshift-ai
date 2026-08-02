# RuleShift AI deployment runbook

This runbook prepares a Vercel + managed PostgreSQL + optional Gemini deployment.
It does not authorize creating projects, enabling billing, configuring secrets,
running hosted migrations, changing DNS, or publishing a deployment.

## Approval gate

Obtain explicit approval before each of these actions:

1. Create or link a Vercel project.
2. Create or select staging/production PostgreSQL resources.
3. Configure encrypted environment variables in Vercel.
4. Run migrations against staging or production.
5. Enable Gemini or make a production provider request.
6. Promote a deployment to production, enable billing, or modify DNS.

## Services, data, and free-tier constraints

| Service | Purpose | Data sent | Free-tier constraint |
| --- | --- | --- | --- |
| GitHub Actions | CI quality gate | Source, dependency metadata, deterministic test data | Public standard runners are free; private repositories have minute/artifact quotas |
| Vercel | Next.js build and runtime | Application bundle, HTTP requests, runtime logs | Hobby is personal/non-commercial and may pause after included usage; limits change |
| Neon or PostgreSQL host | Durable sessions | Snapshots, events, hashed owner token, rules, inventory, NPC state | Free compute/storage/restore windows are finite and idle compute may wake slowly |
| Gemini API | Optional narration proposals | Compact game context and quoted player action | Model availability and RPM/TPM/RPD quotas vary; free-tier content handling differs from paid |

Review current terms before approval:

- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby)
- [Neon pricing](https://neon.com/pricing)
- [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)

The repository never enables billing or creates these resources automatically.

## Environment configuration

Configure values only in encrypted Vercel Project Settings. Scope staging
credentials to Preview and production credentials to Production.

| Variable | Preview | Production |
| --- | --- | --- |
| `DATABASE_URL` | Dedicated staging/preview database | Dedicated production database |
| `AI_PROVIDER_MODE` | `fallback` first, then approved `gemini` | `fallback` until AI smoke approval |
| `GEMINI_API_KEY` | Optional preview-scoped key | Optional production-scoped key |
| `GEMINI_MODEL` | Approved explicit model | Approved explicit model |

Do not configure `TEST_DATABASE_URL` in deployed environments. Do not prefix any
credential with `NEXT_PUBLIC_`. After adding or rotating values, redeploy so
server functions receive the updated environment.

## Database preparation and migration

1. Create or select a dedicated staging branch/database.
2. Confirm it is not the working production target.
3. Enable provider-native backups or create a restore point.
4. Store its connection string as `DATABASE_URL` in the secure operator
   environment; never pass the URL as a command argument.
5. Inspect pending migration SQL under `prisma/migrations`.
6. Parse the exact database name from the provider connection details.
7. Run:

   ```powershell
   npm run db:migrate:deploy -- --confirm-database=EXACT_DATABASE_NAME
   ```

8. Verify `GET /api/health`, create a disposable session, run victory and defeat,
   then abandon/remove test data through normal application ownership paths.

The wrapper uses Prisma `migrate deploy` and refuses a mismatched confirmation.
It does not create migrations or reset data. Production migrations repeat this
procedure only after staging succeeds and a second explicit approval is given.

### Seed strategy

There is no production seed. World/session state is created through validated
APIs. CI and browser tests create isolated owner-scoped records and remove them.
If demonstration fixtures are ever required, add an idempotent staging-only
command rather than a production startup seed.

## Vercel preparation

No `vercel.json` is necessary. Use the detected Next.js framework defaults:

- Install: `npm ci`
- Build: `npm run build`
- Output: Next.js managed output
- Node.js: 24 LTS (pinned by `package.json` and `.nvmrc`)
- Root directory: repository root

Do not run migrations in the build command. A failed build must not partially
mutate a shared database.

## Pre-deployment verification

From a clean checkout with an isolated test database:

```powershell
npm ci
npm run typecheck
npm run lint
npm run test:unit
npm run test:components
npm run test:contracts
npm run test:integration
npm run build
npm run test:e2e
```

Then run fallback-mode victory and defeat at mobile and desktop widths. If a
Gemini key is securely configured and provider contact is approved, run the
opt-in live smoke before enabling Gemini for a preview deployment.

## Deployment sequence after approval

1. Link the approved Vercel project without changing billing.
2. Configure Preview variables and keep `AI_PROVIDER_MODE=fallback`.
3. Apply the migration to the identified staging database.
4. Create a preview deployment.
5. Run `npm run smoke -- https://PREVIEW_URL`.
6. Manually verify victory, defeat, refresh/continue, mobile, desktop, keyboard,
   reduced motion, audio mute, and result image.
7. Inspect browser console and platform logs for errors and secret leakage.
8. Optionally enable Gemini in Preview and repeat a complete game.
9. Present evidence and request a separate production-promotion approval.
10. Apply production migration, deploy, and rerun the same smoke checklist.

## Rollback

Application rollback and database rollback are separate:

- Application: promote the last known-good Vercel deployment or redeploy the
  previous Git commit.
- Database: prefer a forward corrective migration. If data integrity is at
  risk, stop writes and restore the provider backup/branch captured before the
  migration.
- AI: immediately set `AI_PROVIDER_MODE=fallback` and redeploy; sessions remain
  playable without Gemini.

Never run `prisma migrate reset`, delete migrations, or reverse schema changes
manually against production.

## Smoke and health verification

Run the safe automated probe:

```powershell
npm run smoke -- https://DEPLOYMENT_URL
```

It checks `/`, `/create`, and `/api/health`, expects the correct content types,
uses a ten-second timeout, follows no redirects, and never prints response bodies
or environment values.

HTTP 503 from `/api/health` means PostgreSQL is missing, unavailable, or slower
than the bounded readiness timeout. Gemini failure does not make health fail
because deterministic fallback is a supported operating mode.

## Logging and observability

Allowed operational fields include route, status code, duration, safe error
classification, fallback/provider source, turn number, and state version.

Never log:

- database URLs or parsed credentials;
- owner cookies or hashes;
- Gemini keys, prompts, or full provider responses;
- custom player text;
- before/after state snapshots;
- request headers or environment objects.

Monitor health availability, 5xx and 429 rates, p95 action latency, PostgreSQL
connection/latency metrics, Gemini timeout/quota classifications, fallback rate,
and completed-session outcomes. Set provider-console alerts before raising any
quota or enabling billing.

## Rate limiting

The current 30-mutations-per-minute owner limiter is process-local. For a
hackathon preview it limits accidental bursts alongside same-origin checks,
idempotency, input limits, and provider timeouts. Before a broad public launch,
configure platform WAF/rate rules or replace it with a shared atomic limiter.
Do not treat the in-memory limiter as a distributed security boundary.

## Required deployment report

After an approved deployment, record:

- deployment target and public URL;
- commit and migration identifier;
- migration and `/api/health` results;
- fallback victory/defeat results;
- AI-backed result when enabled;
- environment-variable names configured, never values;
- browser console and production-log review;
- remaining operational limitations and rollback target.
