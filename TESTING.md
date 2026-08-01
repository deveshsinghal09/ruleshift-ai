# RuleShift AI testing

Phase 8 uses deterministic, isolated layers rather than live production
services. Vitest covers pure domain behavior, React components, AI contracts,
HTTP/application services, and PostgreSQL repositories. Playwright exercises
the production build through the public UI and APIs.

## Safe test environment

Configure `TEST_DATABASE_URL` in `.env.local` with a dedicated PostgreSQL
database. The test runners do not fall back to `DATABASE_URL`, reject
production-like database names, and delete only records owned by each generated
browser-test token. Never point this variable at a shared or production
database.

No AI credential is required. Browser tests launch separate servers with
`AI_PROVIDER_MODE=fallback` and `AI_PROVIDER_MODE=mock`; both are local and make
no provider requests. The real Gemini smoke test remains opt-in and is excluded
from the quality gate.

Install the browser once:

```powershell
npx playwright install chromium
```

## Commands

| Command | Coverage |
| --- | --- |
| `npm run test:unit` | Deterministic game, RuleShift, utilities, and hooks |
| `npm run test:components` | Landing, design-system components, creation, game, and result UI |
| `npm run test:contracts` | AI schemas/policy/providers, environment, HTTP contracts |
| `npm run test:integration` | Application service, transports, configuration, and PostgreSQL |
| `npm run test:e2e` | Chromium desktop, 375px mobile, keyboard, mock/fallback flows |
| `npm run test:all` | Vitest, database integration, production build, and Playwright |
| `npm run quality` | Strict types, zero-warning lint, and every test layer |

Playwright uses no blind retries and one worker. Failure-only traces,
screenshots, and videos are written to ignored `test-results` output. Seeds,
fixture-provider responses, viewport sizes, and action sequences are fixed so a
clean run is repeatable.

## CI

`.github/workflows/quality.yml` provisions an ephemeral PostgreSQL service,
installs locked dependencies and Chromium, then runs `npm run quality`. It has
read-only repository permissions and performs no deployment.
