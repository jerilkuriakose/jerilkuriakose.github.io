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

/**
 * Reference a token at partial alpha, in whichever form applies.
 * Post-conversion uses `in srgb`, not `in oklab`: the tokens came from HSL, so
 * mixing in sRGB follows the original colour path and keeps the composited
 * bytes identical. Mixing in oklab shifts them.
 */
const refAlpha = (token: string, pct: number) =>
  CONVERTED
    ? `color-mix(in srgb, var(${token}) ${pct}%, transparent)`
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

  const got = await sample8bit(page, refAlpha("--primary", 30));

  // Canvas getImageData un-premultiplies a semi-transparent fill, which rounds
  // each channel by up to ~1. The composited test below is the strict one.
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

/**
 * Strict alpha contract: composite each derived colour over its ACTUAL page
 * background and demand exact bytes. Un-premultiplied sampling (above) hides
 * rounding; compositing does not.
 *
 * Every value here was MEASURED from the pre-conversion build (HSL tokens) in
 * a worktree at the pre-conversion commit - not calculated. Naive sRGB
 * arithmetic disagrees by 1 on some channels because the browser composites
 * premultiplied at 8-bit, so arithmetic is not a valid substitute.
 */
const COMPOSITED: Record<Theme, Array<[string, number, number[]]>> = {
  light: [
    ["--primary", 10, [232, 251, 246]],
    ["--primary", 20, [210, 246, 238]],
    ["--primary", 30, [187, 242, 229]],
    ["--border", 50, [240, 243, 247]],
  ],
  dark: [["--primary", 10, [23, 46, 58]]],
};

for (const theme of ["light", "dark"] as const) {
  test(`alpha composited over real background: ${theme}`, async ({ page }) => {
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

    for (const [token, pct, want] of COMPOSITED[theme]) {
      const got = await page.evaluate((colour) => {
        // var() cannot be resolved by canvas fillStyle - it parses a colour
        // string with no element context. Resolve through a real element first.
        const probe = document.createElement("div");
        probe.style.backgroundColor = colour as string;
        document.body.appendChild(probe);
        const resolved = getComputedStyle(probe).backgroundColor;
        const bg = getComputedStyle(document.body).backgroundColor;
        probe.remove();

        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("no 2d ctx");
        ctx.fillStyle = bg; // the real page background
        ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = resolved; // translucent colour on top
        ctx.fillRect(0, 0, 1, 1);
        return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
      }, refAlpha(token, pct));
      expect(got, `${theme} ${token}/${pct} composited`).toEqual(want);
    }
  });
}

/**
 * Tailwind's own generated opacity utilities emit their own
 * color-mix(in oklab, var(--color-x) N%, transparent). Unwrapping @theme
 * inline changed the *input representation* those utilities receive, so the
 * generated output needs its own assertion - the authored CSS tests do not
 * cover it.
 */
test("Tailwind generated opacity utilities render unchanged", async ({
  page,
}) => {
  await setTheme(page, "light");
  await page.goto("/", { waitUntil: "networkidle" });

  // Assert RENDERED BYTES, not serialisation: Chromium serialises
  // --color-primary as lab(...), and the serialised form is not a stable
  // contract across engines or versions. The bytes are.
  const got = await page.evaluate(() => {
    const read = (cls: string, prop: "bg" | "border") => {
      const el = document.createElement("div");
      el.className = cls;
      document.body.appendChild(el);
      const s = getComputedStyle(el);
      const resolved = prop === "border" ? s.borderTopColor : s.backgroundColor;
      const bg = getComputedStyle(document.body).backgroundColor;
      el.remove();
      const c = document.createElement("canvas");
      c.width = 1;
      c.height = 1;
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = resolved;
      ctx.fillRect(0, 0, 1, 1);
      return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
    };
    return {
      solid: read("bg-primary", "bg"),
      a10: read("bg-primary/10", "bg"),
      a20: read("bg-primary/20", "bg"),
      b20: read("border-primary/20", "border"),
    };
  });

  // Measured from the pre-conversion build, composited over the light page.
  expect(got.solid, "bg-primary").toEqual([29, 211, 168]);
  expect(got.a10, "bg-primary/10").toEqual([232, 251, 246]);
  expect(got.a20, "bg-primary/20").toEqual([210, 246, 238]);
  expect(got.b20, "border-primary/20").toEqual([210, 246, 238]);
});
