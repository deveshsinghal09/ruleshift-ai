# Built with Codex

RuleShift AI was developed through an approval-gated, ten-phase Codex workflow.
Codex was used as an engineering agent for repository inspection, architecture,
implementation, testing, browser review, debugging, documentation, Git history,
and deployment preparation - not merely for autocomplete.

## Working method

Each phase followed the same operating contract:

1. Inspect the existing workspace and preserve completed behavior.
2. Work only inside the approved phase scope.
3. Keep strict TypeScript and avoid `any`.
4. Implement complete behavior rather than core TODO placeholders.
5. Run type checking, linting, tests, and production builds.
6. Correct failures before moving forward.
7. Commit phase work separately so the evolution remains auditable.

Secrets were never requested in chat or committed. External services were used
only after explicit approval, with credentials supplied through server-only
environment variables.

## Phase evidence

| Phase | Codex objective | Durable result | Commit |
| --- | --- | --- | --- |
| 1 | Establish a strict, testable Next.js foundation | App Router, TypeScript strict mode, environment schema, Vitest, lint and build scripts | [`50ff026`](https://github.com/deveshsinghal09/ruleshift-ai/commit/50ff026) |
| 2 | Build the visual language | Customized primitives, tokens, motion rules, reduced motion, accessibility states | [`621af3d`](https://github.com/deveshsinghal09/ruleshift-ai/commit/621af3d) |
| 3 | Prove the complete experience with local data | Landing, character creation, four-turn game, inventory, history and result flow | [`d6e540b`](https://github.com/deveshsinghal09/ruleshift-ai/commit/d6e540b) |
| 4 | Replace UI-owned calculations | Pure deterministic engine, seeded randomness, action processing and invariants | [`1413fce`](https://github.com/deveshsinghal09/ruleshift-ai/commit/1413fce) |
| 5 | Add safe dynamic rules | Twelve registered RuleShifts, conflicts, lifecycle hooks and duration handling | [`2fe3ff9`](https://github.com/deveshsinghal09/ruleshift-ai/commit/2fe3ff9) |
| 6 | Add bounded AI creativity | Provider-neutral director, Gemini adapter, structured validation, repair and fallback | [`a3adb2d`](https://github.com/deveshsinghal09/ruleshift-ai/commit/a3adb2d) |
| 7 | Persist authoritative sessions | PostgreSQL, Prisma repositories, anonymous ownership, idempotency and atomic turns | [`9ce9769`](https://github.com/deveshsinghal09/ruleshift-ai/commit/9ce9769) |
| 8 | Establish the quality gate | Unit, component, contract, integration and browser suites with isolated CI PostgreSQL | [`0036b20`](https://github.com/deveshsinghal09/ruleshift-ai/commit/0036b20) |
| 9 | Finish inclusive interaction quality | Responsive layouts, keyboard play, live announcements, axe checks, audio and result imagery | [`4609c17`](https://github.com/deveshsinghal09/ruleshift-ai/commit/4609c17) |
| 10 | Make the repository reproducible | GitHub Actions, deployment safeguards, architecture and operations documentation | [`633d3c9`](https://github.com/deveshsinghal09/ruleshift-ai/commit/633d3c9) |

The original phase branches remain available in the repository so reviewers can
inspect the implementation sequence without relying on this summary.

## Agentic review loops

Examples of multi-step Codex work preserved in the codebase include:

- Replacing a scripted frontend with a pure engine without changing the player
  flow.
- Designing an AI contract, testing invalid JSON, timeouts, unsafe effects and
  prompt injection, then proving deterministic fallback continuity.
- Adding persistence only after repository interfaces and ownership boundaries
  existed.
- Using disposable PostgreSQL services in CI rather than a developer or
  production database.
- Inspecting responsive pages in a real browser, correcting accessibility
  behavior, and rerunning the complete quality gate.
- Separating the deployed Vercel project from another important project before
  any production action.

## Human authority

The project owner supplied the product specifications, approved the ordered
phases, selected Gemini and Neon, configured credentials outside source code,
approved deployment, and made final product decisions. Codex performed the
approved engineering work and verification within those boundaries.

## Verification evidence

- [GitHub Actions quality gate](https://github.com/deveshsinghal09/ruleshift-ai/actions/workflows/quality.yml)
- [Architecture documentation](./ARCHITECTURE.md)
- [Testing strategy](./TESTING.md)
- [Deployment and rollback procedure](./DEPLOYMENT.md)
- [Published application](https://ruleshift-ai.vercel.app)
