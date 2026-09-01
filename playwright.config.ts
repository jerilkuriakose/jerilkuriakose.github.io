import { defineConfig, devices } from "@playwright/test";

const CHROME =
  process.env.CHROME_PATH ??
  "/home/sagemaker-user/.cache/ms-playwright/chromium-1194/chrome-linux/chrome";

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  expect: {
    // Phase 0 changes no colour, so start at ZERO tolerance.
    // Only widen after observing real flake, and only to the smallest
    // measured value, with the reason recorded in the commit message.
    toHaveScreenshot: {
      maxDiffPixels: 0,
      threshold: 0,
      animations: "disabled",
      caret: "hide",
    },
  },
  use: {
    ...devices["Desktop Chrome"],
    launchOptions: { executablePath: CHROME },
    baseURL: "http://127.0.0.1:8099",
  },
  webServer: {
    // Matches the workspace's established static-server command.
    // reuseExistingServer stays false: a stale `out/` from another
    // session would otherwise silently pass a fidelity baseline.
    command: "python3 -m http.server 8099 --directory out",
    url: "http://127.0.0.1:8099",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
