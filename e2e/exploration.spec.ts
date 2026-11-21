import { test, expect } from "@playwright/test";
import { t, watchErrors, fresh, expectNoErrors } from "./helpers";

const DEALS = ["DL-1051", "DL-1058", "DL-1063", "DL-1067", "DL-1072", "DL-1076", "DL-1081", "DL-1085"];

for (const id of DEALS) {
  test(`exploration deal ${id} loads, adds and reviews cleanly`, async ({ page }) => {
    const errors = watchErrors(page);
    await fresh(page);
    await page.click(t("deal-switcher"));
    await page.click(t(`switch-${id}`));
    const sidebar = page.locator(t("sidebar"));
    await expect(sidebar).toBeVisible();
    // Some deals start without a deal ID: pick it first.
    if (await page.locator(t("suggestions")).count()) {
      const accept = page.locator(`${t("suggestions")} [data-tour^="accept-"]`).first();
      if (await accept.count()) await accept.click();
    }
    const add = page.locator(t("add-to-sirion"));
    if ((await add.count()) && (await add.isEnabled())) {
      await add.click();
      if (await page.locator(t("mismatch")).count()) await page.click(t("mismatch-add"));
      await expect(page.locator(t("reading"))).toHaveCount(0, { timeout: 10_000 });
    }
    const review = page.locator(t("review-in-sirion"));
    if (await review.count()) {
      await review.click();
      await expect(page.locator(t("review"))).toBeVisible();
      await expect(page.locator(t("coverage"))).toBeVisible();
    }
    await expectNoErrors(errors);
  });
}
