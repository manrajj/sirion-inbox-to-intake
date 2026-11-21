// Records the guided walkthrough to public/walkthrough.mp4, for viewers who cannot run the site.
// Usage: npm run build && npm run record:walkthrough
// Needs Playwright's Chromium and ffmpeg on PATH. Serves the static export on port 3300.

import { chromium } from "playwright";
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const PORT = 3300;
const OUT = path.resolve("public/walkthrough.mp4");

async function waitFor(url: string, ms = 30_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Server did not start at ${url}`);
}

async function main() {
  const server = spawn("npx", ["serve", "out", "-l", String(PORT), "--no-clipboard"], { stdio: "ignore" });
  const dir = mkdtempSync(path.join(tmpdir(), "walkthrough-"));
  try {
    await waitFor(`http://localhost:${PORT}/`);
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir, size: { width: 1280, height: 800 } } });
    const page = await context.newPage();
    await page.goto(`http://localhost:${PORT}/`);
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await page.waitForTimeout(1200);
    await page.click('[data-tour="watch"]');
    // Wait for the end card, then hold it briefly.
    await page.getByRole("button", { name: /Try it yourself/ }).waitFor({ state: "visible", timeout: 240_000 });
    await page.waitForTimeout(4000);
    await context.close();
    await browser.close();
    const webm = readdirSync(dir).find((f) => f.endsWith(".webm"));
    if (!webm) throw new Error("No video recorded");
    // Trim the first second of page load; H.264 for wide playback support.
    execFileSync("ffmpeg", ["-y", "-ss", "1", "-i", path.join(dir, webm), "-c:v", "libx264", "-preset", "slow", "-crf", "28", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", OUT], { stdio: "inherit" });
    console.log(`Wrote ${OUT}`);
  } finally {
    server.kill();
    rmSync(dir, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
