# RuleShift AI testing

The project uses deterministic, isolated layers rather than live production
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

When a development key and model are configured securely in `.env.local` and
an external request is explicitly authorized, run `npm run test:ai:live`. The
test makes one bounded provider event request, validates it, and completes the
session through the deterministic fallback without printing provider content.

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
installs locked dependencies, and runs explicit type, lint, unit, component,
contract, integration, and production-build steps. A dependent browser job uses
a fresh PostgreSQL service and Chromium for the complete fallback/mock, mobile,
keyboard, accessibility, and responsive suite. It has read-only repository
permissions, retains failure diagnostics for seven days, prints no environment
values, and performs no deployment.

The opt-in Gemini live smoke is not part of CI and must never use a production
credential. Run it only after local mock/fallback tests pass and external
provider contact is explicitly authorized.
