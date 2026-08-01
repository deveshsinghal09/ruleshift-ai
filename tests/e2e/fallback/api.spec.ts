import { persistedSessionSchema } from "@/server/game/schemas";
import { cleanOwnedSessions, expect, test } from "../fixtures";

test.afterEach(async ({ context }) => cleanOwnedSessions(context));

test("health endpoint reports database and fallback readiness", async ({
  page,
}) => {
  const response = await page.request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({
    dependencies: {
      database: "available",
      deterministicFallback: "ready",
    },
    status: "ok",
  });
});

test("live action API replays idempotency keys and rejects stale versions", async ({
  page,
}) => {
  await page.goto("/");
  const created = await page.evaluate(async () => {
    const response = await fetch("/api/sessions", {
      body: JSON.stringify({
        passport: {
          archetype: "Placement Warrior",
          difficulty: "normal",
          mood: "funny",
          name: "API Explorer",
          title: "the Contract Tester",
        },
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    return { body: (await response.json()) as unknown, status: response.status };
  });
  expect(created.status).toBe(201);
  const session = persistedSessionSchema.parse(created.body);

  const submit = (idempotencyKey: string, actionId = "follow-bell") =>
    page.evaluate(
      async ({ actionId, idempotencyKey, sessionId }) => {
        const response = await fetch(`/api/sessions/${sessionId}/actions`, {
          body: JSON.stringify({
            actionId,
            expectedStateVersion: 1,
            idempotencyKey,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        return {
          body: (await response.json()) as unknown,
          status: response.status,
        };
      },
      { actionId, idempotencyKey, sessionId: session.state.sessionId },
    );

  const first = await submit("browser-idempotency-1");
  expect(first.status).toBe(200);
  expect(persistedSessionSchema.parse(first.body).stateVersion).toBe(2);

  const replay = await submit("browser-idempotency-1");
  expect(replay.status).toBe(200);
  expect(persistedSessionSchema.parse(replay.body).stateVersion).toBe(2);

  const stale = await submit("browser-stale-2", "binary-search");
  expect(stale.status).toBe(409);
  expect(stale.body).toMatchObject({
    error: { code: "STALE_VERSION" },
  });
});
