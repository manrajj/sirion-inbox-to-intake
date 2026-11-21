import { test, expect } from "@playwright/test";
import { t, watchErrors, fresh, expectNoErrors } from "./helpers";

test("main deal by hand: create the deal, ask what's agreed, open the request in Sirion, submit", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);
  await expect(page.locator('[data-coach="open-sidebar"]')).toHaveCount(1);
  await page.click(t("open-sidebar"));
  await expect(page.locator(t("deal-chip"))).toContainText("No request yet");
  await expect(page.locator('[data-coach="create-deal"]')).toHaveCount(1);
  await page.click(t("create-deal"));
  await expect(page.locator(t("toast"))).toContainText("Draft request DL-1042 started in Sirion. Added 12 emails and 1 PDF.");
  await expect(page.locator(t("deal-chip"))).toContainText("Brightline Analytics request · DL-1042");
  await expect(page.locator(t("reading"))).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator(t("match-reason"))).toContainText("brightline-analytics.example");

  await page.click(t("card-agreed"));
  await expect(page.locator(t("assessing"))).toBeVisible();
  await expect(page.locator(t("agreed-uplift"))).toContainText("4%");
  await page.click(t("cite-uplift"));
  await expect(page.locator(t("cite-mark"))).toContainText("the annual uplift stays at 4%");
  await page.click(t("panel-back"));

  await page.click(t("review-in-sirion"));
  await expect(page.locator(t("sirion-app"))).toBeVisible();
  await expect(page.locator(t("core-costCentre"))).toContainText("MKT-4410");
  // Every value is quoted: the source opens the exact sentence
  await expect(page.locator(t("core-payment")).or(page.locator(t("term-payment")))).toContainText("Net 45");
  await page.click(t("source-payment"));
  await expect(page.locator(t("source-popover"))).toContainText("Net 45");
  await page.keyboard.press("Escape");
  await expect(page.locator(t("submit"))).toBeEnabled();
  await page.click(t("submit"));
  await expect(page.locator(t("receipt"))).toContainText("Intake request created", { timeout: 10_000 });

  await expectNoErrors(errors);
});

async function created(page: import("@playwright/test").Page) {
  await fresh(page);
  await page.click(t("open-sidebar"));
  await page.click(t("create-deal"));
  await expect(page.locator(t("reading"))).toHaveCount(0, { timeout: 10_000 });
}

test("removing the confirmation email drops the uplift from agreed", async ({ page }) => {
  const errors = watchErrors(page);
  await created(page);
  await page.click(t("card-agreed"));
  await expect(page.locator(t("agreed-uplift"))).toContainText("4%");
  await page.click(t("panel-back"));
  await page.click(t("added-items"));
  await page.click(t("remove-bl-06"));
  await page.click(t("card-agreed"));
  await expect(page.locator(t("agreed-list"))).toBeVisible();
  await expect(page.locator(t("agreed-uplift"))).toHaveCount(0);
  await expectNoErrors(errors);
});

test("adding a rival supplier's email to the deal warns first", async ({ page }) => {
  const errors = watchErrors(page);
  await created(page);
  await page.click(t("thread-t-cx"));
  await expect(page.locator(t("match-reason"))).toContainText("Not part of this request");
  await page.click(t("add-to-sirion"));
  await expect(page.locator(t("mismatch"))).toBeVisible();
  await page.click(t("mismatch-cancel"));
  await expect(page.locator(t("mismatch"))).toHaveCount(0);
  await expectNoErrors(errors);
});

test("if supplier emails are removed, Submit says why, and one click fixes it", async ({ page }) => {
  const errors = watchErrors(page);
  await created(page);
  await page.click(t("added-items"));
  await page.click(t("remove-bl-01"));
  await page.click(t("review-in-sirion"));
  await expect(page.locator(t("submit"))).toBeDisabled();
  await expect(page.locator(t("submit-why"))).toContainText("empty");
  await page.click(t("submit-fix"));
  await expect(page.locator(t("submit-why"))).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator(t("submit"))).toBeEnabled();
  await expectNoErrors(errors);
});
