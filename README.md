# RuleShift AI

RuleShift AI is a browser-based adventure where an AI Dungeon Master can propose
changes to the story, world, and rules while a deterministic game engine protects
authoritative state.

This repository currently contains the Phase 1 project foundation only. Gameplay,
the production design system, AI integration, persistence, and deployment are
intentionally reserved for later approved phases.

## Requirements

- Node.js 20.9 or newer
- npm 10 or newer

No API keys, database, or cloud services are required for Phase 1.

## Local setup

Install the locked dependencies:

```powershell
npm ci
```

Start the development server:

```powershell
npm run dev
```

Open `http://localhost:3000`.

## Verification

Run each Phase 1 quality check:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
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

## Environment variables

Phase 1 does not require application environment variables. Future variable
names will be documented in `.env.example` without secret values. Credentials
must be configured locally or in the selected hosting provider and must never be
committed.

## Security defaults

- Next.js removes the `X-Powered-By` response header.
- Responses include basic framing, MIME-sniffing, referrer, browser-feature, and
  cross-origin isolation headers.
- Environment values are selected explicitly and validated with Zod.
- Local environment files are ignored while `.env.example` remains tracked.
