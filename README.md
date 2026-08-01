<div align="center">

<h1>RuleShift AI</h1>

<h3>Every turn changes the story. Sometimes it changes the rules.</h3>

<p>
  A cinematic browser adventure where an AI Dungeon Master invents worlds,
  characters, choices, and temporary reality shifts while a deterministic
  engine keeps every consequence fair, reproducible, and safe.
</p>

<p>
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&amp;logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-149ECA?logo=react&amp;logoColor=white">
  <img alt="TypeScript 6" src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&amp;logoColor=white">
  <img alt="Tailwind CSS 4" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&amp;logoColor=white">
  <img alt="Prisma 7" src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&amp;logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&amp;logoColor=white">
  <img alt="Gemini" src="https://img.shields.io/badge/AI-Gemini-8E75B2?logo=googlegemini&amp;logoColor=white">
  <img alt="Vitest" src="https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&amp;logoColor=white">
  <img alt="Playwright" src="https://img.shields.io/badge/E2E-Playwright-2EAD33?logo=playwright&amp;logoColor=white">
  <img alt="Vercel" src="https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&amp;logoColor=white">
</p>

<p><strong>Deterministic gameplay | Registered RuleShifts | Structured AI | Atomic saves | Accessible play | Offline fallback</strong></p>

</div>

> [!IMPORTANT]
> Gemini proposes creative content, but it never directly controls health,
> damage, energy, score, inventory quantities, rule execution, victory, or
> defeat. RuleShift AI remains fully playable when the provider is missing,
> unavailable, rate-limited, or returns invalid output.

The MVP is a polished single-player hackathon experience. Its strict TypeScript
engine is the sole authority over gameplay, while AI output passes schema,
policy, registry, and bounded-effect validation before it can influence a turn.

## Architecture

The application uses Next.js App Router, strict TypeScript, Tailwind CSS,
customized shadcn/ui primitives, PostgreSQL with Prisma, and a provider-neutral
AI boundary currently implemented with Gemini.

Generated text is parsed, schema-validated, policy-checked, converted into
bounded proposals, and then applied by registered deterministic behavior. No AI
response is executed as code and no provider can directly set final state.

### Production topology

```mermaid
flowchart LR
    subgraph client ["Client"]
        browser["Player browser"]
    end
    subgraph gateway ["Vercel edge"]
        nextRoutes["Next.js routes"]
    end
    subgraph service ["Application runtime"]
        gameApp["RuleShift AI service"]
    end
    subgraph datastore ["Persistent state"]
        postgres["PostgreSQL"]
    end
    subgraph external ["Optional creative provider"]
        gemini["Gemini API"]
    end

    browser -->|"HTTPS"| nextRoutes
    nextRoutes -->|"Validated commands"| gameApp
    gameApp -->|"Atomic sessions"| postgres
    gameApp -.->|"Gemini: structured proposals"| gemini
```

### Authoritative turn processing

```mermaid
sequenceDiagram
    title One authoritative player turn
    participant Browser
    participant RouteHandler
    participant GameService
    participant Engines
    participant AIDirector
    participant PostgreSQL

    Browser->>RouteHandler: POST action and expected version
    RouteHandler->>RouteHandler: Validate origin, body, and owner
    RouteHandler->>GameService: Authenticated command
    GameService->>PostgreSQL: Load session or idempotent replay
    PostgreSQL-->>GameService: Owned session snapshot
    GameService->>Engines: Resolve deterministic preview
    GameService->>AIDirector: Request structured event
    AIDirector-->>GameService: Validated event or fallback
    GameService->>Engines: Apply approved event and rules
    GameService->>PostgreSQL: Commit snapshots and replay record
    PostgreSQL-->>GameService: Committed state version
    GameService-->>RouteHandler: Validated next state
    RouteHandler-->>Browser: Safe response
```

### Session lifecycle

```mermaid
stateDiagram-v2
    direction LR
    [*] --> Playing
    Playing --> Playing: valid turn
    Playing --> Victory: objective and reward complete
    Playing --> Defeat: terminal condition reached
    Playing --> Abandoned: owner abandons
    Victory --> [*]
    Defeat --> [*]
    Abandoned --> [*]
```

### Persistence model

```mermaid
erDiagram
    direction LR
    GAME_SESSION ||--o{ GAME_EVENT : records
    GAME_SESSION ||--o{ ACTIVE_RULE : activates
    GAME_SESSION ||--o{ INVENTORY_ITEM : contains
    GAME_SESSION ||--o{ NPC_STATE : tracks
    GAME_SESSION ||--o{ TURN_REQUEST : deduplicates

    GAME_SESSION {
        uuid id PK
        string ownerTokenHash
        string status
        int stateVersion
        int currentTurn
        json currentSnapshot
    }
    GAME_EVENT {
        uuid id PK
        uuid sessionId FK
        int turn
        json beforeStateSnapshot
        json afterStateSnapshot
    }
    ACTIVE_RULE {
        uuid id PK
        uuid sessionId FK
        string ruleKey
        int remainingTurns
    }
    INVENTORY_ITEM {
        uuid id PK
        uuid sessionId FK
        string itemId
        int quantity
    }
    NPC_STATE {
        uuid id PK
        uuid sessionId FK
        string npcId
        int relationship
    }
    TURN_REQUEST {
        uuid id PK
        uuid sessionId FK
        string idempotencyKey
        int resultingVersion
    }
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for trust boundaries, request flows,
ownership, persistence, and deployment topology.

## Screens and features

| Route | Purpose |
| --- | --- |
| `/` | Cinematic landing page, world examples, and changing-rule preview |
| `/create` | Character, mood, difficulty, and passport creation |
| `/game/[sessionId]` | Persisted adventure console with actions, inventory, rules, and history |
| `/result/[sessionId]` | Private victory or defeat summary |
| `/api/sessions/[sessionId]/result/image` | Owner-protected 1200×630 result card |
| `/api/health` | Database readiness and deterministic-fallback status |
| `/design-system` | Customized component calibration gallery |

The prepared demo follows Devesh, the Placement Warrior, through the Haunted
Campus of Infinite Assessments toward the Golden Offer Letter. The interface is
responsive, keyboard-accessible, screen-reader aware, reduced-motion safe, and
fully understandable while muted.

## Requirements

- Node.js 20.19 or newer
- npm 10 or newer
- PostgreSQL 15 or newer
- Chromium for Playwright browser tests
- Optional Gemini API key and model identifier

## Local setup

1. Clone the repository and install the exact locked dependency graph:

   ```powershell
   npm ci
   ```

2. Copy `.env.example` to `.env.local`. Keep real values out of chat, source,
   screenshots, logs, and commits.

3. Configure a local or dedicated development PostgreSQL connection:

   ```dotenv
   DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=verify-full
   AI_PROVIDER_MODE=fallback
   ```

4. Confirm the target is a development database, then apply migrations:

   ```powershell
   npm run db:migrate:dev
   ```

5. Start the application:

   ```powershell
   npm run dev
   ```

6. Open `http://localhost:3000` and confirm `/api/health` returns HTTP 200.

For Neon, use a pooled connection string from the Neon Console. The server
normalizes legacy strict SSL modes to `verify-full`. Do not point automated
tests at a shared development or production database.

## Environment variables

| Name | Required | Scope | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes for persisted play | Server only | PostgreSQL application connection |
| `TEST_DATABASE_URL` | Tests only | Test process only | Dedicated isolated test database; never falls back to `DATABASE_URL` |
| `AI_PROVIDER_MODE` | Optional | Server only | `gemini`, `fallback`, or test-only `mock`; defaults to `gemini` |
| `GEMINI_API_KEY` | Only for Gemini mode | Server only | Gemini credential |
| `GEMINI_MODEL` | Only for Gemini mode | Server only | Explicit configurable model identifier |

No environment variable is prefixed with `NEXT_PUBLIC_`; credentials are never
included in browser bundles. Missing Gemini configuration automatically selects
the deterministic fallback path.

## AI-provider setup

1. Create or select a Gemini API project in Google AI Studio.
2. Store the credential as `GEMINI_API_KEY` in `.env.local` for development or
   in encrypted hosting environment settings for deployment.
3. Store the chosen model identifier as `GEMINI_MODEL`; it is deliberately not
   hardcoded.
4. Set `AI_PROVIDER_MODE=gemini`.
5. Run the opt-in live provider smoke only when external access is authorized:

   ```powershell
   npm run test:ai:live
   ```

The smoke test uses one validated provider-generated event in a complete game,
then proves deterministic fallback continuity. It does not log prompts,
provider responses, or credentials.

## Database and migrations

- Development: `npm run db:migrate:dev` refuses production-like targets.
- Test: `npm run db:migrate:test` requires `TEST_DATABASE_URL` and rejects
  production-like database names.
- Staging/production: back up and identify the target, then run:

  ```powershell
  npm run db:migrate:deploy -- --confirm-database=EXACT_DATABASE_NAME
  ```

The deployment wrapper refuses to proceed unless the confirmation exactly
matches the database name parsed from `DATABASE_URL`. Migrations are never run
automatically during `next build`.

No production seed is required. Each new session is created through the
validated session API, so seeding cannot overwrite player data.

## Development and verification commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create the production bundle |
| `npm start` | Serve an existing production bundle |
| `npm run typecheck` | Run strict TypeScript validation |
| `npm run lint` | Run ESLint with zero warnings |
| `npm run test:unit` | Test deterministic engines and utilities |
| `npm run test:components` | Test components and user-facing flows |
| `npm run test:contracts` | Test AI, environment, health, and HTTP contracts |
| `npm run test:integration` | Test services, transports, and PostgreSQL repositories |
| `npm run test:e2e` | Test production Chromium fallback, mock, mobile, and keyboard flows |
| `npm run test:all` | Run Vitest, database tests, build, and browser tests |
| `npm run quality` | Run strict types, lint, and every test layer |
| `npm run db:validate` | Validate the Prisma schema |
| `npm run db:migrate:deploy` | Apply committed migrations after exact target confirmation |
| `npm run smoke -- URL` | Verify a running deployment without reading sensitive data |

Testing details and isolation rules live in [TESTING.md](./TESTING.md).

## Deployment

The repository is compatible with Vercel without `vercel.json`; Next.js route
handlers, timeouts, and security headers are already expressed in application
code. Deployment is intentionally manual and approval-gated.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for free-tier constraints, environment
configuration, staging migration, smoke verification, rollback, logging,
observability, and the exact approval checklist.

## Security and reliability

- Anonymous ownership uses a cryptographically random secure HTTP-only cookie;
  only its SHA-256 hash is stored.
- Mutations require same-origin requests, bounded JSON bodies, Zod validation,
  optimistic versions, idempotency keys, and rate limiting.
- Authoritative turns persist atomically with before/after snapshots.
- AI proposals pass JSON parsing, schema validation, content policy, rule
  registry validation, and deterministic bounded-effect conversion.
- Errors expose themed safe messages; internal logs contain classifications,
  not connection strings, owner tokens, prompts, or provider responses.
- Security headers disable framing, MIME sniffing, camera, microphone, and
  geolocation while applying a strict referrer policy.

The included rate limiter is per runtime instance and suitable as a basic
hackathon abuse guard. It is not a distributed quota. A higher-risk public
launch should add platform WAF/rate rules or a shared limiter before accepting
untrusted high-volume traffic.

## Fallback mode

Set `AI_PROVIDER_MODE=fallback`, omit Gemini credentials, or allow provider
errors to exhaust the bounded retry/repair path. The deterministic local event
provider then supplies validated narration and choices while the same game and
RuleShift engines continue the session. Database persistence remains required.

## Demo script

1. Open `/` and explain that AI can propose stories but never authoritative
   health, score, inventory, or victory.
2. Start the prepared Devesh passport with the Unstable difficulty.
3. Follow the bell and use the binary-search action.
4. Show the Incorrectly Correct RuleShift overlay and its remaining duration.
5. Resolve a custom action, inspect inventory/history, and open the Golden Offer
   Letter.
6. Show the private result card, then replay on Impossible difficulty for the
   deterministic defeat route.
7. Repeat with `AI_PROVIDER_MODE=fallback` to demonstrate continuity without AI.

## Troubleshooting

| Symptom | Resolution |
| --- | --- |
| `/api/health` returns 503 | Verify `DATABASE_URL`, network allow rules, SSL parameters, and migration state |
| Session cannot be restored | Confirm the same browser owns the secure cookie and the database is reachable |
| Gemini never activates | Check server-only key/model names and set `AI_PROVIDER_MODE=gemini` |
| Gemini returns 429/timeouts | Wait for quota recovery; gameplay should continue through fallback |
| Tests refuse the database | Use a dedicated database whose name is not production-like in `TEST_DATABASE_URL` |
| Browser tests cannot start | Install Chromium with `npx playwright install chromium` |
| Production build cannot fetch fonts | Allow the build environment outbound access to Google Fonts or vendor approved local fonts in a future change |

## Known limitations

- Single-player anonymous sessions only; clearing the owner cookie loses access
  to existing private sessions.
- Rate limiting is process-local, not globally distributed across serverless
  instances.
- Result images are owner-protected rather than public social links.
- Gemini free-tier availability and model quotas are not guaranteed; fallback
  mode is the reliability baseline.
- The MVP does not include authentication, multiplayer, analytics, billing,
  automated database backups, or a custom domain.
