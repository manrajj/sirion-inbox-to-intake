import { test, expect } from "@playwright/test";
import { t, watchErrors, fresh, expectNoErrors } from "./helpers";

test("main deal by hand: add the thread, create the request in Sirion, pick the payment terms, submit", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);
  await expect(page.locator('[data-coach="open-sidebar"]')).toHaveCount(1);
  await page.click(t("open-sidebar"));
  await expect(page.locator(t("sidebar"))).toBeVisible();
  await page.click(t("add-to-sirion"));
  await expect(page.locator(t("toast"))).toContainText("Added 6 emails and 1 PDF to DL-1042 in Sirion");
  await expect(page.locator(t("reading"))).toHaveCount(0, { timeout: 10_000 });

  await page.click(t("card-agreed"));
  await expect(page.locator(t("agreed-uplift"))).toContainText("4%");
  await page.click(t("cite-uplift"));
  await expect(page.locator(t("cite-mark"))).toContainText("the annual uplift stays at 4%");
  await page.click(t("panel-back"));

  await page.click(t("review-in-sirion"));
  await expect(page.locator(t("sirion-app"))).toBeVisible();
  await expect(page.locator(t("core-costCentre"))).toContainText("MKT-4410");

  // Submit stays off until the payment conflict is settled and the check is ticked
  await page.click(t("confirm-check"));
  await expect(page.locator(t("submit"))).toBeDisabled();
  await page.click(t("pick-payment-0"));
  await expect(page.locator(t("options-payment"))).toContainText("Net 45");
  await expect(page.locator(t("submit"))).toBeEnabled();
  await page.click(t("submit"));
  await expect(page.locator(t("receipt"))).toContainText("Intake request created", { timeout: 10_000 });
  await expect(page.locator(t("typed-count"))).toContainText("typed by hand");

  await expectNoErrors(errors);
});

test("removing the confirmation email drops the uplift from agreed", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);
  await page.click(t("open-sidebar"));
  await page.click(t("add-to-sirion"));
  await expect(page.locator(t("reading"))).toHaveCount(0, { timeout: 10_000 });
  await page.click(t("card-agreed"));
  await expect(page.locator(t("agreed-uplift"))).toContainText("4%");
  await page.click(t("added-items"));
  await page.click(t("remove-bl-06"));
  await expect(page.locator(t("agreed-uplift"))).toHaveCount(0);
  await expectNoErrors(errors);
});

test("adding a rival supplier's email to the deal warns first", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);
  await page.click(t("thread-t-cx"));
  await page.click(t("open-sidebar"));
  await page.click(t("add-to-sirion"));
  await expect(page.locator(t("mismatch"))).toBeVisible();
  await page.click(t("mismatch-cancel"));
  await expect(page.locator(t("mismatch"))).toHaveCount(0);
  await expectNoErrors(errors);
});

test("going to Sirion before adding the supplier thread: Submit says why, and one click fixes it", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);
  await page.click(t("open-sidebar"));
  await expect(page.locator(t("match-reason"))).toContainText("brightline-analytics.example");
  await expect(page.locator(t("match-reason"))).toContainText("Q-BL-2291");
  await page.click(t("review-in-sirion"));
  await expect(page.locator(t("submit"))).toBeDisabled();
  await expect(page.locator(t("submit-why"))).toContainText("2 fields are empty");
  await expect(page.locator(t("summary"))).not.toContainText("Legal");
  await page.click(t("submit-fix"));
  await expect(page.locator(t("core-value"))).toContainText("48,000", { timeout: 10_000 });
  await expect(page.locator(t("submit-why"))).toContainText("Pick the payment terms");
  await page.click(t("pick-payment-0"));
  await expect(page.locator(t("submit-why"))).toContainText("Tick the box");
  await page.click(t("confirm-check"));
  await expect(page.locator(t("submit-why"))).toHaveCount(0);
  await expect(page.locator(t("submit"))).toBeEnabled();
  await expectNoErrors(errors);
});
