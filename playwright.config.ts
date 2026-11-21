import { defineConfig, devices } from "@playwright/test";

// Runs against the static export, the same files Vercel serves.
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3200", viewport: { width: 1280, height: 800 } },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } }],
  webServer: {
    command: "npx serve out -l 3200 --no-clipboard",
    url: "http://localhost:3200",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
