import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    // Locally reuse the installed Chrome; CI installs Playwright's Chromium.
    channel: isCI ? undefined : "chrome",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: isCI ? undefined : "chrome" } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: isCI ? undefined : "chrome" } },
  ],
  webServer: {
    command: isCI ? `npm run start -- -p ${PORT}` : `npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}/demo`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
