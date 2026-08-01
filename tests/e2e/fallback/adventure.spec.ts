import { validateGameState } from "@/domain/game/schemas";
import type { GameState, InventoryItem } from "@/domain/game/types";
import { hashOwnerToken, OWNER_COOKIE_NAME } from "@/server/auth/owner-token";
import {
  cleanOwnedSessions,
  createTestDatabasePool,
  enterAdventure,
  expect,
  setActiveRuleRemainingTurns,
  test,
} from "../fixtures";

test.afterEach(async ({ context }) => cleanOwnedSessions(context));

test("landing to a persisted fallback victory, including custom action and RuleShift lifecycle", async ({
  context,
  page,
}) => {
  await enterAdventure(page);
  await page
    .getByRole("button", { name: "Follow the bell into the archive" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "A binary-search challenge blocks the quad",
    }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "A binary-search challenge blocks the quad",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Binary-search the examiner/u })
    .click();

  await expect(
    page.getByRole("dialog", { name: "Incorrectly Correct" }),
  ).toBeVisible();
  await expect(page.getByText("3 OF 3 TURNS REMAIN")).toBeVisible();
  await page
    .getByRole("button", { name: "Continue with deterministic rules" })
    .click();
  await setActiveRuleRemainingTurns(context, page, 1);
  await page.reload();
  await page
    .getByRole("button", { name: "Continue with deterministic rules" })
    .click();

  await page
    .getByLabel("Try a custom action")
    .fill("Convince the rubric that recursion is a soft skill.");
  await page.getByRole("button", { name: "Resolve custom action" }).click();
  await expect(
    page.getByRole("heading", {
      name: "The final interview has only one question",
    }),
  ).toBeVisible();
  await expect(page.getByText(/RuleShift expired\./u)).toBeVisible();

  await page
    .getByRole("button", { name: "Open the Golden Offer Letter" })
    .click();
  await expect(page).toHaveURL(/\/result\/[0-9a-f-]+$/u);
  await expect(
    page.getByRole("heading", {
      name: "The Golden Offer Letter is yours.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Victory", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The complete timeline" }),
  ).toBeVisible();
});

test("hard route reaches a deterministic defeat", async ({ page }) => {
  await enterAdventure(page, "Impossible");
  await page
    .getByRole("button", { name: "Kick open the Faculty of Algorithms" })
    .click();
  await page
    .getByRole("button", { name: /Binary-search the examiner/u })
    .click();
  await page
    .getByRole("button", { name: "Continue with deterministic rules" })
    .click();
  await page
    .getByRole("button", { name: "Compliment its asymptotic complexity" })
    .click();

  await expect(page).toHaveURL(/\/result\/[0-9a-f-]+$/u);
  await expect(
    page.getByRole("heading", {
      name: "The campus keeps your application.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Defeat", { exact: true })).toBeVisible();
});

test("prevents duplicate submissions and exposes themed network recovery", async ({
  page,
}) => {
  await enterAdventure(page);
  let actionRequests = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/actions")) {
      actionRequests += 1;
    }
  });
  await page
    .getByRole("button", { name: "Follow the bell into the archive" })
    .dblclick();
  await expect(
    page.getByRole("heading", {
      name: "A binary-search challenge blocks the quad",
    }),
  ).toBeVisible();
  expect(actionRequests).toBe(1);

  await page.route("**/actions", (route) => route.abort("connectionfailed"));
  await page
    .getByRole("button", { name: /Binary-search the examiner/u })
    .click();
  await expect(
    page.getByText("The adventure archive could not be reached."),
  ).toBeVisible();
  await page.unroute("**/actions");
  await page
    .getByRole("button", { name: /Binary-search the examiner/u })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Incorrectly Correct" }),
  ).toBeVisible();
});

test("uses an inventory item through the authoritative API", async ({
  context,
  page,
}) => {
  await enterAdventure(page);
  const sessionId = page.url().split("/").at(-1);
  const ownerCookie = (await context.cookies()).find(
    (cookie) => cookie.name === OWNER_COOKIE_NAME,
  );
  if (!sessionId || !ownerCookie) {
    throw new Error("The isolated test session did not expose its identifiers.");
  }

  const pool = createTestDatabasePool();
  try {
    const result = await pool.query<{ current_snapshot: unknown }>(
      "SELECT current_snapshot FROM game_sessions WHERE id = $1 AND owner_token_hash = $2",
      [sessionId, hashOwnerToken(ownerCookie.value)],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error("The isolated database session could not be restored.");
    }
    const state = validateGameState(row.current_snapshot);
    const tonic: InventoryItem = {
      consumable: true,
      description: "An isolated fixture consumed by the real engine.",
      effects: [{ amount: 12, type: "player-energy" }],
      id: "quality-tonic",
      name: "Quality Gate Tonic",
      quantity: 1,
      rarity: "rare",
      stackable: true,
      usesPerItem: 1,
      usesRemaining: 1,
    };
    const patchedState: GameState = validateGameState({
      ...state,
      currentEvent: {
        ...state.currentEvent,
        choices: [
          {
            available: true,
            effects: [],
            energyCost: 0,
            id: "use-quality-tonic",
            itemId: tonic.id,
            kind: "use-item",
            label: "Use the Quality Gate Tonic",
            risk: "safe",
          },
          ...state.currentEvent.choices,
        ],
      },
      player: { ...state.player, energy: 70, inventory: [tonic] },
    });
    await pool.query(
      "UPDATE game_sessions SET current_snapshot = $1::jsonb WHERE id = $2",
      [JSON.stringify(patchedState), sessionId],
    );
  } finally {
    await pool.end();
  }

  await page.reload();
  await page.getByRole("button", { name: "Use the Quality Gate Tonic" }).click();
  await page.getByRole("button", { name: "Open inventory" }).click();
  await expect(page.getByText("Your inventory is empty")).toBeVisible();
});
