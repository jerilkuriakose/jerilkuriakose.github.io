import { test, expect } from "@playwright/test";
import { settle, freezeVisuals, lockMotion, setTheme } from "./helpers";

/**
 * Broad rendering coverage - NOT proof of the migration.
 *
 * Six full-page screenshots cannot prove 49 call sites were replaced:
 * they never exercise focus, hover, selection or scrollbar states, and
 * some tokens have no consumer at all. token-contract.spec.ts is the
 * actual proof; this catches layout and large-area colour regressions.
 */
const WIDTHS = [375, 768, 1280] as const;

for (const theme of ["light", "dark"] as const) {
  for (const width of WIDTHS) {
    test(`screenshot: ${theme} @ ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await setTheme(page, theme);
      await page.goto("/", { waitUntil: "networkidle" });

      await expect
        .poll(() =>
          page.evaluate(
            (t) => document.documentElement.classList.contains(t),
            theme,
          ),
        )
        .toBe(true);

      await freezeVisuals(page); // kills CSS animation/transition + blur artifacts
      await settle(page); // lets Motion's finite entrance animations finish
      await lockMotion(page); // neutralises the infinite scroll-indicator loop

      await expect(page).toHaveScreenshot(`tokens-${theme}-${width}.png`, {
        fullPage: true,
      });
    });
  }
}
