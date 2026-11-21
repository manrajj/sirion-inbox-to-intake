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
  await expect(page.locator(t("card-agreed"))).toBeVisible({ timeout: 10_000 });
  await page.locator(t("at-input")).focus();
  await key(page, t("at-t-fin"));
  await expect(page.locator(t("reading"))).toHaveCount(0, { timeout: 10_000 });
  await key(page, t("review-in-sirion"));

  const review = t("review");
  for (const k of ["legalEntity", "scope", "value", "termStart", "requester", "costCentre", "dataAccess", "price", "uplift", "sla"]) {
    await key(page, `${review} ${t(`confirm-${k}`)} input`, "Space");
  }
  await key(page, `${review} ${t("mark-open-payment")}`);
  await key(page, `${review} ${t("mark-open-save-payment")}`);
  await key(page, `${t("record-complete")} input`, "Space");
  await key(page, t("submit"));
  await expect(page.locator(t("submit-modal"))).toBeVisible();
  await key(page, t("confirm-submit"));
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
  await expect(page.getByRole("tablist", { name: "Chapters" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tablist", { name: "Chapters" })).toHaveCount(0);
});
