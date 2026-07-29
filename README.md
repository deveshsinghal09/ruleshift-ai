# RuleShift AI

RuleShift AI is a browser-based adventure where an AI Dungeon Master can propose
changes to the story, world, and rules while a deterministic game engine protects
authoritative state.

The repository currently contains the Phase 7 MVP foundation: the approved
design system, deterministic game and RuleShift engines, provider-neutral Gemini
AI direction with deterministic fallback, and PostgreSQL-backed private game
sessions.

## Requirements

- Node.js 20.19 or newer
- npm 10 or newer
- PostgreSQL 15 or newer (local, Neon, or another development instance)

Gemini is optional. PostgreSQL is required for persisted browser play.

## Local setup

Install the locked dependencies:

```powershell
npm ci
```

Create `.env.local` (never commit it) and add your development connection:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=verify-full
```

For Neon, copy the pooled development connection string from the Neon Console.
Keep the credential only in `.env.local`; do not paste it into chat, source
files, screenshots, or commits. Apply the prepared migration only after
confirming the URL points to the intended development database:

```powershell
npm run db:migrate:dev
```

Start the development server:

```powershell
npm run dev
```

Open `http://localhost:3000`.

## Demo routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page and animated RuleShift preview |
| `/create` | Character, mood, difficulty, and passport flow |
| `/game/[sessionId]` | Scripted four-turn adventure console |
| `/result/[sessionId]` | Private persisted adventure result |
| `/design-system` | Component calibration gallery |

Game sessions are stored in PostgreSQL. A cryptographically random anonymous
owner token is kept in a secure HTTP-only cookie; only its SHA-256 hash is
stored in the database.

## Deterministic engine

The pure domain layer lives in `src/domain/game`. It owns health, energy, score,
inventory, enemy health, NPC relationships, world stability, objectives, turn
progression, and outcomes.

- `processTurn(state, action, context)` validates and resolves one immutable
  state transition.
- The RNG state is seeded and stored with each session. No gameplay calculation
  uses uncontrolled randomness.
- The local event provider supplies exploration, dialogue, combat, puzzle,
  quest, reward, and trap events with validated choices.
- React renders engine results and never calculates authoritative gameplay
  values.
- Predefined RuleShift behavior is registered TypeScript code. AI output may
  propose known keys but cannot execute code or directly control outcomes.

## Persistence and APIs

- `POST /api/sessions` creates an owned session.
- `GET /api/sessions` lists resumable sessions for the current anonymous owner.
- `GET` and `DELETE /api/sessions/[sessionId]` restore or abandon a session.
- `POST /api/sessions/[sessionId]/actions` processes one versioned,
  idempotent, authoritative turn.
- `GET /api/sessions/[sessionId]/result` returns completed result data.

Turns use optimistic state versions, unique idempotency keys, a unique
session/turn constraint, and a serializable transaction containing the current
snapshot, before/after event snapshots, normalized inventory/NPC/rule state,
and the response replay record.

## Verification

Run the complete quality suite:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Database integration tests run separately and only against the explicitly
configured development/test database:

```powershell
$env:TEST_DATABASE_URL = $env:DATABASE_URL
npm run db:test
```

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm start` | Serve a completed production build |
| `npm run lint` | Run ESLint with zero warnings allowed |
| `npm run typecheck` | Run strict TypeScript validation |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run db:validate` | Validate the Prisma schema without connecting |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate:dev` | Safely apply development migrations |
| `npm run db:test` | Run live PostgreSQL repository integration tests |

## Environment variables

- `DATABASE_URL` — server-only development PostgreSQL connection.
- `TEST_DATABASE_URL` — optional isolated PostgreSQL connection used by
  `npm run db:test`; falls back to `DATABASE_URL`.
- `GEMINI_API_KEY` and `GEMINI_MODEL` — optional server-only AI configuration.

`.env.example` contains names only. Credentials must be configured in
`.env.local` and must never be committed.

## Security defaults

- Next.js removes the `X-Powered-By` response header.
- Responses include basic framing, MIME-sniffing, referrer, browser-feature, and
  cross-origin isolation headers.
- Environment values are selected explicitly and validated with Zod.
- Mutations enforce same-origin requests, bounded JSON bodies, Zod schemas,
  anonymous ownership, optimistic versions, idempotency, and rate limits.
- Raw owner tokens and database/provider credentials are never logged or stored
  in application tables.
- Local environment files are ignored while `.env.example` remains tracked.
