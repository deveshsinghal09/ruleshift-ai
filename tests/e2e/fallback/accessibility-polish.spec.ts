import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import {
  cleanOwnedSessions,
  enterAdventure,
  expect,
  test,
} from "../fixtures";

const viewports = [375, 640, 768, 1024, 1440] as const;

async function expectAccessible(page: Page, label: string): Promise<void> {
  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    scan.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    })),
    `${label} should have no automated WCAG A/AA violations`,
  ).toEqual([]);
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
}

test.afterEach(async ({ context }) => cleanOwnedSessions(context));

test("landing, creation, game panels, rules, and result pass axe", async ({
  page,
}) => {
  await page.goto("/");
  await expectAccessible(page, "landing page");

  await page.getByRole("link", { name: "Start your adventure" }).click();
  await expectAccessible(page, "character creation");

  await enterAdventure(page);
  await expectAccessible(page, "main game");

  await page.getByRole("button", { name: "Open inventory" }).click();
  await expect(page.getByRole("dialog", { name: "Carried anomalies" })).toBeVisible();
  await expectAccessible(page, "inventory drawer");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Follow the bell into the archive" }).click();
  await page.getByRole("button", { name: /Binary-search the examiner/u }).click();
  await expect(page.getByRole("dialog", { name: "Incorrectly Correct" })).toBeVisible();
  await expectAccessible(page, "RuleShift dialog");
  await page.getByRole("button", { name: "Continue with deterministic rules" }).click();
  await expectAccessible(page, "active rules game state");

  await page.getByRole("button", { name: "Weaponize a spectacularly wrong answer" }).click();
  await page.getByRole("button", { name: "Open the Golden Offer Letter" }).click();
  await expect(page).toHaveURL(/\/result\/[0-9a-f-]+$/u);
  await expectAccessible(page, "result page");

  await page.getByRole("button", { name: "Share result" }).click();
  const image = page.getByRole("img", { name: /result card for Devesh/u });
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth))
    .toBe(1200);
  await expectAccessible(page, "result image dialog");
});

test("core layouts remain usable from 375px through 1440px", async ({ page }) => {
  await enterAdventure(page);

  for (const width of viewports) {
    await page.setViewportSize({ height: 900, width });
    await expectNoHorizontalOverflow(page);
    await expect(page.getByRole("heading", { name: "The attendance bell rings for you" })).toBeVisible();
  }

  await page.setViewportSize({ height: 812, width: 375 });
  const mobileNavigation = page.getByRole("navigation", {
    name: "Mobile game navigation",
  });
  await expect(mobileNavigation).toBeVisible();
  for (const label of ["Story", "Player", "Rules", "Inventory", "History"]) {
    const target = mobileNavigation.getByRole("button", {
      exact: true,
      name: label,
    });
    const box = await target.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }

  const customAction = page.getByLabel("Try a custom action");
  await customAction.focus();
  await expect
    .poll(async () => (await mobileNavigation.boundingBox())?.y ?? 0)
    .toBeGreaterThanOrEqual(812);

  await page.setViewportSize({ height: 900, width: 768 });
  await page.getByRole("button", { name: "Open inventory" }).click();
  const tabletDrawer = page.getByRole("dialog", { name: "Carried anomalies" });
  const tabletBox = await tabletDrawer.boundingBox();
  expect(tabletBox?.x).toBeGreaterThan(300);
  expect(tabletBox?.height).toBe(900);
});

test("skip link, reduced motion, and audio preferences work without hidden dependencies", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to adventure content" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await expect(page.locator("#main-content")).toHaveCSS("animation-name", "none");

  await enterAdventure(page);
  await page.getByRole("button", { name: "Audio settings" }).click();
  await page.getByRole("button", { name: "Mute" }).click();
  await page.getByRole("slider", { name: /Volume/u }).fill("0.3");
  await page.reload();
  await page.getByRole("button", { name: "Audio settings" }).click();
  await expect(page.getByRole("button", { name: "Unmute" })).toBeVisible();
  await expect(page.getByText("Volume 30%")).toBeVisible();

  await page.getByRole("button", { name: "Open inventory" }).click();
  await expect(page.getByRole("dialog", { name: "Carried anomalies" })).toHaveCSS(
    "animation-name",
    "none",
  );
});
