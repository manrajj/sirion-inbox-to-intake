import { test, expect, type Page } from "@playwright/test";
import { t, watchErrors, fresh, expectNoErrors } from "./helpers";

// Every step of the main flow is reached and operated from the keyboard alone:
// focus moves to the control, Enter or Space operates it. No mouse events.
async function key(page: Page, sel: string, k: "Enter" | "Space" = "Enter") {
  const el = page.locator(sel).first();
  await el.focus();
  await expect(el).toBeFocused();
  await page.keyboard.press(k);
}

test("keyboard-only main flow", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);

  // The skip link is the first stop
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveText(/skip/i);

  await key(page, t("open-sidebar"));
  await key(page, t("add-to-sirion"));
  await expect(page.locator(t("reading"))).toHaveCount(0, { timeout: 10_000 });
  await key(page, t("review-in-sirion"));
  await expect(page.locator(t("sirion-app"))).toBeVisible();
  await key(page, t("pick-payment-1"));
  await key(page, `${t("confirm-check")} input`, "Space");
  await key(page, t("submit"));
  await expect(page.locator(t("receipt"))).toBeVisible({ timeout: 10_000 });

  // Visible focus ring on the focused control
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle);
  expect(outline).not.toBe("none");
  await expectNoErrors(errors);
});

test("Escape closes the walkthrough", async ({ page }) => {
  await page.goto("/");
  await key(page, t("watch"));
  await expect(page.locator(`[data-tour="film-step"]`)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(`[data-tour="film-step"]`)).toHaveCount(0);
});
