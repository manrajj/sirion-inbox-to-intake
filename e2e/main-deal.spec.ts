import { test, expect } from "@playwright/test";
import { t, watchErrors, fresh, expectNoErrors } from "./helpers";

test("main deal by hand: add the thread, open in Sirion, settle the conflict, submit, Legal", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);
  // The coach mark points at the first click
  await expect(page.locator('[data-coach="open-sidebar"]')).toHaveCount(1);
  await page.click(t("open-sidebar"));
  await expect(page.locator(t("sidebar"))).toBeVisible();
  await page.click(t("add-to-sirion"));
  await expect(page.locator(t("toast"))).toContainText("Added 6 emails and 1 PDF to DL-1042 in Sirion");
  await expect(page.locator(t("reading"))).toHaveCount(0, { timeout: 10_000 });

  await page.click(t("card-agreed"));
  await expect(page.locator(t("agreed-uplift"))).toContainText("4%");
  await page.click(t("cite-uplift-3"));
  await expect(page.locator(t("cite-mark"))).toContainText("the annual uplift stays at 4%");
  await page.click(t("panel-back"));

  await page.click(t("review-in-sirion"));
  await expect(page.locator(t("sirion-app"))).toBeVisible();
  await expect(page.locator(t("basic-info"))).toContainText("7 of 7 filled from email");
  await expect(page.locator(t("core-costCentre"))).toContainText("MKT-4410");

  // Submit is gated until the payment conflict is settled
  await expect(page.locator(t("submit"))).toBeDisabled();
  await expect(page.locator(t("conflict-payment"))).toContainText("Net 45");
  await page.click(t("mark-open-payment"));
  await expect(page.locator(t("term-payment"))).toContainText("Sent to Legal as open");

  await expect(page.locator(t("submit"))).toBeEnabled();
  await page.click(t("submit"));
  await expect(page.locator(t("confirm-submit"))).toBeDisabled();
  await page.click(t("confirm-check"));
  await page.click(t("confirm-submit"));
  await expect(page.locator(t("receipt"))).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(t("typed-count"))).toContainText("0 of 7 fields typed by hand");

  await page.click(t("open-legal"));
  await expect(page.locator(t("legal-open"))).toContainText("Payment");
  await expect(page.locator(t("legal-evidenced"))).toContainText("4%");
  await page.click(t("start-drafting"));
  await expect(page.locator(t("legal"))).toContainText("started drafting");

  await expectNoErrors(errors);
});

test("picking one side of the conflict makes it an agreed term", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);
  await page.click(t("open-sidebar"));
  await page.click(t("add-to-sirion"));
  await page.click(t("review-in-sirion"));
  await page.click(t("pick-payment-0"));
  await expect(page.locator(t("term-payment"))).toContainText("Net 45");
  await expect(page.locator(t("term-payment"))).toContainText("Picked by you");
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
