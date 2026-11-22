import { test, expect, devices } from "@playwright/test";
import { t, watchErrors, fresh, expectNoErrors } from "./helpers";

test.use({ ...devices["iPhone 13"], browserName: "chromium" });

test("phone: Outlook mobile inbox, add-in sheet, Sirion mobile request, submit", async ({ page }) => {
  const errors = watchErrors(page);
  await fresh(page);
  await expect(page.locator('[data-coach="thread-t-bl"]')).toHaveCount(1);
  await page.click(t("thread-t-bl"));
  await expect(page.locator(t("attachment"))).toBeVisible();
  await page.click(t("open-sidebar"));
  await expect(page.locator(t("deal-chip"))).toContainText("No request yet");
  await page.click(t("create-deal"));
  await expect(page.locator(t("reading"))).toHaveCount(0, { timeout: 10_000 });
  await page.click(t("card-agreed"));
  await expect(page.locator(t("agreed-uplift"))).toContainText("4%");
  await page.click(t("cite-uplift"));
  await expect(page.locator(t("cite-mark"))).toContainText("the annual uplift stays at 4%");
  await page.click(t("back-to-addin"));
  await page.click(t("answer-review"));
  await expect(page.locator(t("sirion-here"))).toBeVisible();
  await page.click(t("submit"));
  await expect(page.locator(t("receipt"))).toContainText("Intake request created", { timeout: 10_000 });
  await expectNoErrors(errors);
});
