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
  await expect(page.locator(t("deal-chip"))).toContainText("Brightline Analytics request · DL-1042");
  // The toast only reports what has happened: it waits for the reading, and says the draft is not submitted.
  await expect(page.locator(t("reading"))).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator(t("toast"))).toContainText("Draft DL-1042 saved with 12 emails and 1 PDF.");
  await expect(page.locator(t("toast"))).toContainText("Not submitted yet");
  await expect(page.locator(t("match-reason"))).toHaveCount(0);

  await page.click(t("card-agreed"));
  await expect(page.locator(t("assessing"))).toBeVisible();
  await expect(page.locator(t("agreed-uplift"))).toContainText("4%");
  await page.click(t("cite-uplift"));
  await expect(page.locator(t("cite-mark"))).toContainText("the annual uplift stays at 4%");
  // A term can be corrected right in the assistant's answer
  await page.click(t("agreed-edit-sla"));
  await page.fill(t("agreed-input-sla"), "99.95% uptime; 5% monthly credit");
  await page.click(t("agreed-save-sla"));
  await expect(page.locator(t("agreed-sla"))).toContainText("99.95% uptime");
  await expect(page.locator(t("agreed-sla"))).toContainText("Edited");
  await page.click(t("panel-back"));

  await page.click(t("review-in-sirion"));
  await expect(page.locator(t("sirion-app"))).toBeVisible();
  await expect(page.locator(t("core-costCentre"))).toContainText("MKT-4410");
  await expect(page.locator(t("term-sla"))).toContainText("99.95% uptime");
  // Every value is quoted: the source opens the exact sentence
  await expect(page.locator(t("core-payment")).or(page.locator(t("term-payment")))).toContainText("Net 45");
  await page.click(t("source-payment"));
  await expect(page.locator(t("source-popover"))).toContainText("Net 45");
  await page.keyboard.press("Escape");
  await expect(page.locator(t("sirion-here"))).toContainText("You are in Sirion now");
  // Any value can be edited; the edit is marked and can be undone
  await page.click(t("edit-scope"));
  await page.fill(t("input-scope"), "Brightline Insights platform, 30 named users");
  await page.click(t("save-scope"));
  await expect(page.locator(t("core-scope"))).toContainText("30 named users");
  await expect(page.locator(t("edited-scope"))).toContainText("Edited by you");
  await page.locator(t("edited-scope")).getByRole("button").click();
  await expect(page.locator(t("core-scope"))).toContainText("25 named users");
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
