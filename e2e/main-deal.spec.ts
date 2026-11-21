import { test, expect } from "@playwright/test";
import { t, watchErrors, fresh, expectNoErrors } from "./helpers";

const CORE = ["legalEntity", "scope", "value", "termStart", "requester", "costCentre", "dataAccess"];

test("main deal by hand: add, review, mark the conflict open, submit, Legal, record", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);
  await page.click(t("open-sidebar"));
  await expect(page.locator(t("sidebar"))).toBeVisible();
  await page.click(t("add-to-sirion"));
  await expect(page.locator(t("card-agreed"))).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(t("agreed-uplift"))).toContainText("4%");

  // Pull in the finance thread with @
  await page.click(t("at-input"));
  await page.click(t("at-t-fin"));
  await expect(page.locator(t("added-items"))).toContainText("Added to DL-1042");

  await page.click(t("review-in-sirion"));
  const review = page.locator(t("review"));
  await expect(review).toBeVisible();

  // Submit is gated until everything is resolved
  await expect(page.locator(t("submit"))).toBeDisabled();

  for (const k of CORE) {
    const box = review.locator(t(`confirm-${k}`));
    await box.click();
  }
  for (const k of ["price", "uplift", "sla"]) await review.locator(t(`confirm-${k}`)).click();

  // The payment conflict goes to Legal as open, with a reason and an owner
  await expect(review.locator(t("term-payment"))).toContainText("Conflict");
  await review.locator(t("mark-open-payment")).click();
  await review.locator(t("mark-open-save-payment")).click();
  await expect(review.locator(t("term-payment"))).toContainText("owner Legal");

  await page.locator(t("record-complete")).click();
  await expect(page.locator(t("submit"))).toBeEnabled();
  await page.click(t("submit"));
  await page.click(t("confirm-submit"));
  await expect(page.locator(t("receipt"))).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(t("typed-count"))).toContainText("0");

  await page.click(t("open-legal"));
  await expect(page.locator(t("legal-open"))).toContainText("Payment");
  await expect(page.locator(t("legal-evidenced"))).toContainText("4%");
  await page.click(t("start-drafting"));
  await page.click(t("open-record"));
  await expect(page.locator(t("invoice-flag"))).toBeVisible();

  await expectNoErrors(errors);
});

test("removing the confirmation email drops the uplift from agreed", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);
  await page.click(t("open-sidebar"));
  await page.click(t("add-to-sirion"));
  await expect(page.locator(t("agreed-uplift"))).toContainText("Accepted");
  await page.click(t("remove-bl-06"));
  await expect(page.locator(t("agreed-uplift"))).not.toContainText("Accepted by both");
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
