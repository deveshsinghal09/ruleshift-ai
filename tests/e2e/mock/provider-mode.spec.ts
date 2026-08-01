import {
  cleanOwnedSessions,
  enterAdventure,
  expect,
  test,
} from "../fixtures";

test.afterEach(async ({ context }) => cleanOwnedSessions(context));

test("mock AI mode passes a fixture proposal through the live application boundary", async ({
  page,
}) => {
  await enterAdventure(page);
  await page
    .getByRole("button", { name: "Follow the bell into the archive" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Mock reality compiles a new corridor",
    }),
  ).toBeVisible();
  await expect(page.getByText("Mock AI signal")).toBeVisible();
});
