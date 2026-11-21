import { expect, type Page } from "@playwright/test";

export const t = (id: string) => `[data-tour="${id}"]`;

/** Collects page errors so each test can assert a clean run. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !/favicon/.test(m.text())) errors.push(m.text());
  });
  return errors;
}

export async function fresh(page: Page, path = "/product/") {
  await page.goto(path);
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(path);
}

export async function expectNoErrors(errors: string[]) {
  expect(errors, errors.join("\n")).toEqual([]);
}
