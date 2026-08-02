# First-Time Usability Study and Measured Evaluation

This protocol tests whether a new player understands RuleShift AI without
coaching. It is intentionally short and does not evaluate presentation skill.

## Status

The reproducible Codex-run evaluation was completed on August 2, 2026. The
five-person external study remains pending because automated interaction cannot
measure a human player's comprehension or confidence. The two evidence sets are
kept separate below so automated success is not presented as human feedback.

## Codex-run measured evaluation

### Method

- Commit: `002d8a3682817027e32ce317c03ec73f11587ff1`
- Environment: GitHub-hosted Ubuntu runner, Node.js 24, Chromium through
  Playwright, PostgreSQL 17, and isolated test data.
- AI modes: deterministic fallback and recorded mock provider. No paid or live
  AI request was required.
- Evidence: [GitHub Actions quality run 30744650978](https://github.com/deveshsinghal09/ruleshift-ai/actions/runs/30744650978)
- Reproduction command: `npm run test:e2e`

The browser suite ran 13 scenarios in 72 seconds. The browser job completed in
138 seconds including dependency installation, Chromium installation, database
startup, build startup, and cleanup. All 13 scenarios passed.

### Measured results

| Evaluation pass | Measured route or condition | Result | Observed blocker |
| --- | --- | --- | --- |
| 1. Core victory journey | Landing, creation, persisted game, refresh, custom action, RuleShift activation and expiration, result | Passed; victory result and complete timeline reached | None |
| 2. Core defeat journey | Impossible difficulty and deterministic high-risk actions | Passed; defeat result reached | None |
| 3. Reliability journey | Double-click submission, forced action-network failure, retry, inventory consumption, stale version and idempotency replay | Passed; double-click emitted exactly one action request, recovery message appeared, retry succeeded, item was consumed, replay returned the same version, and stale state returned HTTP 409 | None |
| 4. Responsive journey | 375, 640, 768, 1024, and 1440 px game layouts | Passed; zero horizontal-overflow failures, narration remained visible, all five mobile navigation targets were at least 44 px high, and the 768 px inventory used a full-height side drawer | None |
| 5. Accessible and resilient journey | Keyboard-only first turn, skip link, reduced motion, muted audio persistence, missing browser storage, fallback AI, and mock AI | Passed; keyboard journey completed, preferences persisted, missing storage restored a valid passport, and both AI modes remained playable | None |

### Accessibility measurements

Automated axe scans covered eight interactive states: landing, character
creation, main game, inventory drawer, RuleShift dialog, active-rule game state,
result page, and result-image dialog. The scan reported zero WCAG 2.0/2.1 A or
AA violations. The same journey recorded zero browser console errors.

The keyboard scenario used focus plus Enter activation for the landing CTA,
three creation steps, game entry, and the first game action. The reduced-motion
scenario confirmed that the skip link moves focus to main content and that the
main content and inventory drawer do not animate when reduced motion is active.

### Findings and decisions

- No critical interaction, responsive, keyboard, persistence, fallback, or
  recovery blocker was found in the measured paths.
- The result screen is reachable through both victory and defeat routes.
- The RuleShift lifecycle is observable from activation through expiration.
- The application remains operable without a live AI provider.
- Automated tests prove that controls can be operated; they do not prove that a
  first-time person understands the objective, AI boundary, or RuleShift wording.
  Those three questions still require the external participant protocol below.

## Participant criteria

- Has not previously used RuleShift AI.
- Can use a modern desktop or mobile browser.
- May be familiar or unfamiliar with interactive fiction.
- Is not shown the README or given gameplay instructions first.

## Test procedure

1. Give the participant only the live URL.
2. Start a timer when the landing page loads.
3. Do not explain the objective, controls, AI boundary, or RuleShifts.
4. Ask the participant to play until victory, defeat, or five minutes pass.
5. Record observations without helping.
6. Ask the five comprehension questions below.

## Comprehension questions

1. What are you trying to achieve?
2. What does the AI control?
3. What does the deterministic engine control?
4. What changed when the RuleShift appeared?
5. What would happen if the AI provider failed?

## Success criteria

- Objective understood within 20 seconds.
- First action submitted without assistance.
- RuleShift change explained accurately after its overlay.
- AI and deterministic responsibilities distinguished after one turn receipt.
- Result screen reached within five minutes.
- No critical keyboard, mobile, or recovery blocker encountered.

## External participant evidence table

| Participant | Device | Objective under 20s | First action unassisted | RuleShift understood | AI boundary understood | Reached result | Key confusion |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| 2 | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| 3 | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| 4 | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| 5 | Pending | Pending | Pending | Pending | Pending | Pending | Pending |

## Decision rule

If fewer than four of five participants understand the objective or the
RuleShift without help, revise onboarding before adding features. If fewer than
four understand the AI boundary, revise the turn receipt and landing-page
problem statement. Record the observed wording that caused confusion and test
the revision with new participants.
