import { defineConfig, devices } from "@playwright/test";

const desktopViewport = { width: 1280, height: 720 };
const mobileViewport = { width: 375, height: 667 };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: desktopViewport,
      },
    },
    {
      name: "mobile",
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: mobileViewport,
      },
    },
  ],
  webServer: {
    command: "node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
