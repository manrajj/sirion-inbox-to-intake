import { test, expect } from "@playwright/test";
import { watchErrors, expectNoErrors } from "./helpers";

test("walkthrough: every chapter seeks cleanly offline and the end card hands over", async ({ page, context }) => {
  const errors = watchErrors(page);
  await page.goto("/");
  await page.evaluate(() => sessionStorage.clear());
  await page.waitForLoadState("networkidle");
  // The film needs no network once the page has loaded.
  await context.setOffline(true);
  await page.click('[data-tour="watch"]');
  const film = page.getByRole("tablist", { name: "Chapters" });
  await expect(film).toBeVisible();
  const bars = page.getByRole("button", { name: /^Go to chapter/ });
  const n = await bars.count();
  expect(n).toBe(12);
  for (let i = 0; i < n; i++) {
    await bars.nth(i).click();
    await page.waitForTimeout(700);
    await expect(film).toBeVisible();
  }
  // The last chapter plays to the end card
  await expect(page.getByRole("button", { name: /Try it yourself/ })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Try it yourself/ }).click();
  await expect(film).toHaveCount(0);
  await expect(page.locator('[data-tour="sidebar"]')).toBeVisible();
  await expectNoErrors(errors);
});

test("narrative pages render without errors and fit one screen", async ({ page }) => {
  const errors = watchErrors(page);
  for (const p of ["/", "/why/", "/problem/", "/stakeholders/", "/assumptions/", "/metrics/", "/next/", "/sources/"]) {
    await page.goto(p);
    await page.waitForTimeout(200);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(h, p).toBeLessThanOrEqual(820);
  }
  await expectNoErrors(errors);
});
