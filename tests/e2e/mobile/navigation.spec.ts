import {
  cleanOwnedSessions,
  enterAdventure,
  expect,
  test,
} from "../fixtures";

test.afterEach(async ({ context }) => cleanOwnedSessions(context));

test("mobile command dock exposes every gameplay panel at 375px", async ({
  page,
}) => {
  await enterAdventure(page);
  const navigation = page.getByRole("navigation", {
    name: "Mobile game navigation",
  });
  await expect(navigation).toBeVisible();

  for (const panel of [
    { button: "Player", heading: "Player status" },
    { button: "Rules", heading: "Rule and objective" },
    { button: "Inventory", heading: "Inventory" },
    { button: "History", heading: "Adventure history" },
  ]) {
    await navigation.getByRole("button", { name: panel.button }).click();
    await expect(
      page.getByRole("dialog").getByRole("heading", { name: panel.heading }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  }
});
