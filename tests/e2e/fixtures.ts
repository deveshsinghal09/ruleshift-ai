import { test as base, expect } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
import { Pool } from "pg";
import { validateGameState } from "@/domain/game/schemas";
import { hashOwnerToken, OWNER_COOKIE_NAME } from "@/server/auth/owner-token";
import { hardenPostgresSslMode } from "@/server/db/connection";

function requireTestDatabaseUrl(): string {
  const value = process.env.TEST_DATABASE_URL?.trim();
  if (!value) {
    throw new Error("Playwright requires an isolated TEST_DATABASE_URL.");
  }
  return value;
}

const databaseUrl = requireTestDatabaseUrl();

export const test = base;
export { expect };

export function createTestDatabasePool(): Pool {
  return new Pool({
    connectionString: hardenPostgresSslMode(databaseUrl),
    max: 2,
  });
}

export async function cleanOwnedSessions(
  context: BrowserContext,
): Promise<void> {
  const ownerCookie = (await context.cookies()).find(
    (cookie) => cookie.name === OWNER_COOKIE_NAME,
  );
  if (!ownerCookie) {
    return;
  }
  const pool = createTestDatabasePool();
  try {
    await pool.query(
      "DELETE FROM game_sessions WHERE owner_token_hash = $1",
      [hashOwnerToken(ownerCookie.value)],
    );
  } finally {
    await pool.end();
  }
}

export async function setActiveRuleRemainingTurns(
  context: BrowserContext,
  page: Page,
  remainingTurns: number,
): Promise<void> {
  const sessionId = page.url().split("/").at(-1);
  const ownerCookie = (await context.cookies()).find(
    (cookie) => cookie.name === OWNER_COOKIE_NAME,
  );
  if (!sessionId || !ownerCookie) {
    throw new Error("The isolated RuleShift session was not available.");
  }
  const pool = createTestDatabasePool();
  try {
    const result = await pool.query<{ current_snapshot: unknown }>(
      "SELECT current_snapshot FROM game_sessions WHERE id = $1 AND owner_token_hash = $2",
      [sessionId, hashOwnerToken(ownerCookie.value)],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error("The isolated RuleShift snapshot was not found.");
    }
    const state = validateGameState(row.current_snapshot);
    const patched = validateGameState({
      ...state,
      activeRules: state.activeRules.map((rule) => ({
        ...rule,
        remainingTurns,
      })),
    });
    await pool.query(
      "UPDATE game_sessions SET current_snapshot = $1::jsonb WHERE id = $2",
      [JSON.stringify(patched), sessionId],
    );
  } finally {
    await pool.end();
  }
}

export async function enterAdventure(
  page: Page,
  difficulty: "Relaxed" | "Unstable" | "Impossible" = "Unstable",
): Promise<void> {
  await page.goto("/");
  await page.getByRole("link", { name: "Start your adventure" }).click();
  await expect(
    page.getByRole("heading", { name: "Who enters the unstable world?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: difficulty }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .getByRole("button", { name: "Enter the haunted campus" })
    .click();
  await expect(page).toHaveURL(/\/game\/[0-9a-f-]+$/u);
  await expect(
    page.getByRole("heading", { name: "The attendance bell rings for you" }),
  ).toBeVisible();
}
