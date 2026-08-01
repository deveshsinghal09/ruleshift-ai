import {
  cleanOwnedSessions,
  expect,
  test,
} from "../fixtures";

test.afterEach(async ({ context }) => cleanOwnedSessions(context));

test("a player can enter and resolve a turn using only keyboard activation", async ({
  page,
}) => {
  await page.goto("/");
  const start = page.getByRole("link", { name: "Start your adventure" });
  await start.focus();
  await expect(start).toBeFocused();
  await page.keyboard.press("Enter");

  for (let step = 0; step < 3; step += 1) {
    const continueButton = page.getByRole("button", { name: "Continue" });
    await continueButton.focus();
    await expect(continueButton).toBeFocused();
    await page.keyboard.press("Enter");
  }

  const enter = page.getByRole("button", {
    name: "Enter the haunted campus",
  });
  await enter.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/game\/[0-9a-f-]+$/u);

  const action = page.getByRole("button", {
    name: "Follow the bell into the archive",
  });
  await action.focus();
  await expect(action).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", {
      name: "A binary-search challenge blocks the quad",
    }),
  ).toBeVisible();
});

test("missing browser storage falls back to a valid default passport", async ({
  page,
}) => {
  await page.goto("/create");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByLabel("Character name")).toHaveValue("Devesh");
  await expect(
    page.getByRole("heading", { name: "Who enters the unstable world?" }),
  ).toBeVisible();
});
