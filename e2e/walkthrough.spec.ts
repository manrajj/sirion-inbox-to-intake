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
  const film = page.locator(`[data-tour="film-step"]`);
  await expect(film).toBeVisible();
  const step = page.locator('[data-tour="film-step"]');
  await expect(step).toContainText("Step 1 of 7");
  for (let i = 2; i <= 7; i++) {
    await page.getByRole("button", { name: /^Next step/ }).click();
    await expect(step).toContainText(`Step ${i} of 7`);
    await page.waitForTimeout(500);
  }
  // The last chapter plays to the end card
  await expect(page.getByRole("button", { name: /Try it yourself/ })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Try it yourself/ }).click();
  await expect(film).toHaveCount(0);
  // A fresh start, with the coach mark on the first click
  await expect(page.locator('[data-coach="open-sidebar"]')).toHaveCount(1);
  await expectNoErrors(errors);
});

test("narrative pages render without errors and fit one screen", async ({ page }) => {
  const errors = watchErrors(page);
  for (const p of ["/why/", "/stakeholders/", "/problem/", "/metrics/"]) {
    await page.goto(p);
    await page.waitForTimeout(200);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(h, p).toBeLessThanOrEqual(820);
  }
  await expectNoErrors(errors);
});
