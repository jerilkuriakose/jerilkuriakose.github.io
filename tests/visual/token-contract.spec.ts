import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sample8bit, setTheme, type Theme } from "./helpers";

/**
 * Pre-conversion the tokens hold HSL *channels* ("0 0% 100%"), which are only
 * a valid colour inside hsl(). Post-conversion they hold complete oklch()
 * values, usable bare. So the RENDERED colour is representation-independent
 * but the REFERENCE FORM is not - wrap accordingly.
 *
 * That asymmetry is what makes this a genuine before/after contract: the same
 * expected 8-bit values must hold through the representation change.
 */
const CSS = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
const CONVERTED = /--background:\s*oklch\(/.test(CSS);

/** Reference a colour token in whichever form the current CSS requires. */
const ref = (token: string) =>
  CONVERTED ? `var(${token})` : `hsl(var(${token}))`;

/** Reference a token at partial alpha, in whichever form applies. */
const refAlpha = (token: string, pct: number) =>
  CONVERTED
    ? `color-mix(in oklab, var(${token}) ${pct}%, transparent)`
    : `hsl(var(${token}) / ${pct / 100})`;


/**
 * Expected USED 8-bit sRGB per token. Must not change in Phase 0.
 *
 * This is the real proof of the migration. Screenshots cannot prove all 49
 * call sites were replaced correctly - they never exercise focus, hover,
 * selection, scrollbar states, or tokens with no consumer at all.
 *
 * These values are representation-independent: they are what the browser
 * actually paints, so they are identical before (HSL) and after (OKLCH)
 * the conversion. That is exactly what makes them a valid contract.
 */
const EXPECTED: Record<Theme, Record<string, number[]>> = {
  light: {
    "--background": [255, 255, 255, 255],
    "--foreground": [15, 23, 41, 255],
    "--card": [255, 255, 255, 255],
    "--card-foreground": [15, 23, 41, 255],
    "--popover": [255, 255, 255, 255],
    "--popover-foreground": [15, 23, 41, 255],
    "--primary": [29, 211, 168, 255],
    "--primary-foreground": [15, 23, 41, 255],
    "--secondary": [241, 245, 249, 255],
    "--secondary-foreground": [15, 23, 41, 255],
    "--muted": [241, 245, 249, 255],
    "--muted-foreground": [101, 117, 139, 255],
    "--accent": [102, 255, 219, 255],
    "--accent-bg": [241, 245, 249, 255],
    "--accent-foreground": [15, 23, 41, 255],
    "--destructive": [239, 67, 67, 255],
    "--destructive-foreground": [250, 250, 250, 255],
    "--border": [225, 231, 239, 255],
    "--input": [225, 231, 239, 255],
    "--ring": [29, 211, 168, 255],
    "--navy": [15, 23, 41, 255],
    "--navy-light": [23, 32, 54, 255],
    "--navy-lighter": [32, 42, 64, 255],
    "--slate": [133, 145, 163, 255],
    "--slate-light": [158, 169, 183, 255],
    "--lightest-slate": [197, 203, 211, 255],
    "--white": [246, 247, 248, 255],
  },
  dark: {
    "--background": [15, 23, 41, 255],
    "--foreground": [197, 203, 211, 255],
    "--card": [23, 32, 54, 255],
    "--card-foreground": [197, 203, 211, 255],
    "--popover": [23, 32, 54, 255],
    "--popover-foreground": [197, 203, 211, 255],
    "--primary": [102, 255, 219, 255],
    "--primary-foreground": [15, 23, 41, 255],
    "--secondary": [32, 42, 64, 255],
    "--secondary-foreground": [197, 203, 211, 255],
    "--muted": [32, 42, 64, 255],
    "--muted-foreground": [133, 145, 163, 255],
    "--accent-bg": [32, 42, 64, 255],
    "--accent-foreground": [197, 203, 211, 255],
    "--destructive": [129, 29, 29, 255],
    "--destructive-foreground": [250, 250, 250, 255],
    "--border": [43, 55, 85, 255],
    "--input": [43, 55, 85, 255],
    "--ring": [102, 255, 219, 255],
  },
};

for (const theme of ["light", "dark"] as const) {
  test(`token contract: ${theme} (${CONVERTED ? "oklch" : "hsl channels"})`, async ({
    page,
  }) => {
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

    for (const [token, want] of Object.entries(EXPECTED[theme])) {
      const got = await sample8bit(page, ref(token));
      expect(got, `${theme} ${token}`).toEqual(want);
    }
  });
}

test("alpha sites keep their colour and gain the right alpha", async ({
  page,
}) => {
  await setTheme(page, "light");
  await page.goto("/", { waitUntil: "networkidle" });

  // Post-conversion this is color-mix(in oklab, X 30%, transparent), which is
  // provably equivalent to alpha 0.3: premultiplied interpolation gives
  // premultiplied 0.3*C and alpha 0.3; unpremultiplying restores C exactly.
  const got = await sample8bit(page, refAlpha("--primary", 30));

  // Canvas getImageData un-premultiplies a semi-transparent fill, which rounds
  // each channel by up to ~1. Exact bytes are already covered by the opaque
  // token assertions above; this test's job is that the HUE survives and the
  // alpha is right, so a small per-channel tolerance is correct here.
  const want = [29, 211, 168];
  for (let i = 0; i < 3; i++) {
    expect(
      Math.abs(got[i] - want[i]),
      `channel ${i}: got ${got[i]}, want ~${want[i]}`,
    ).toBeLessThanOrEqual(2);
  }
  expect(got[3]).toBeGreaterThanOrEqual(75);
  expect(got[3]).toBeLessThanOrEqual(78); // 0.3 * 255 = 76.5
});
