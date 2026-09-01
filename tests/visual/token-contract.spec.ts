import { test, expect } from "@playwright/test";
import { sample8bit, setTheme, type Theme } from "./helpers";

/**
 * Expected USED 8-bit sRGB per token: what the browser actually PAINTS.
 *
 * Screenshots cannot prove every call site is correct - they never exercise
 * focus, hover, selection, scrollbar states, or tokens with no consumer at all.
 *
 * References are bare var(). An earlier `CONVERTED = /--background:\s*oklch\(/`
 * sniff chose between var() and hsl(var()) forms; Phase 2 repoints --background
 * to var(--canvas), which would have flipped that sniff false and silently
 * switched 5 tests to invalid hsl(var(--background)) references while reporting
 * green. Phase 0 is committed, so only the bare form remains.
 */

/** Reference a colour token. Bare var() is the only supported form. */
const ref = (token: string) => `var(${token})`;

/**
 * Reference a token at partial alpha, in whichever form applies.
 * Post-conversion uses `in srgb`, not `in oklab`: the tokens came from HSL, so
 * mixing in sRGB follows the original colour path and keeps the composited
 * bytes identical. Mixing in oklab shifts them.
 */
const refAlpha = (token: string, pct: number) =>
  `color-mix(in srgb, var(${token}) ${pct}%, transparent)`;


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
    "--background": [244, 249, 247, 255],
    "--foreground": [20, 41, 34, 255],
    "--card": [244, 249, 247, 255],
    "--card-foreground": [20, 41, 34, 255],
    "--popover": [244, 249, 247, 255],
    "--popover-foreground": [20, 41, 34, 255],
    "--primary": [30, 211, 169, 255],
    "--primary-foreground": [20, 41, 34, 255],
    "--secondary": [218, 237, 230, 255],
    "--secondary-foreground": [20, 41, 34, 255],
    "--muted": [218, 237, 230, 255],
    "--muted-foreground": [88, 103, 98, 255],
    "--accent-bg": [218, 237, 230, 255],
    "--accent-foreground": [20, 41, 34, 255],
    "--destructive": [182, 49, 50, 255],
    "--destructive-foreground": [244, 249, 247, 255],
    "--border": [218, 237, 230, 255],
    "--input": [3, 133, 105, 255],
    "--ring": [0, 137, 108, 255],
  },
  dark: {
    "--background": [23, 52, 45, 255],
    "--foreground": [244, 249, 247, 255],
    "--card": [20, 41, 34, 255],
    "--card-foreground": [244, 249, 247, 255],
    "--popover": [20, 41, 34, 255],
    "--popover-foreground": [244, 249, 247, 255],
    "--primary": [30, 211, 169, 255],
    "--primary-foreground": [20, 41, 34, 255],
    "--secondary": [1, 70, 54, 255],
    "--secondary-foreground": [244, 249, 247, 255],
    "--muted": [1, 70, 54, 255],
    "--muted-foreground": [162, 224, 203, 255],
    "--accent-bg": [1, 70, 54, 255],
    "--accent-foreground": [244, 249, 247, 255],
    "--destructive": [237, 117, 110, 255],
    "--destructive-foreground": [20, 41, 34, 255],
    "--border": [3, 133, 105, 255],
    "--input": [9, 171, 136, 255],
    "--ring": [49, 161, 131, 255],
  },
};

for (const theme of ["light", "dark"] as const) {
  test(`token contract: ${theme}`, async ({
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
  const want = [30, 211, 169];
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
    ["--primary", 10, [222, 245, 238]],
    ["--primary", 20, [201, 241, 231]],
    ["--primary", 30, [179, 238, 223]],
    ["--border", 50, [231, 243, 238]],
  ],
  dark: [["--primary", 10, [23, 68, 57]]],
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

  // Re-measured after the Phase 2 palette retune, composited over the light page.
  expect(got.solid, "bg-primary").toEqual([30, 211, 169]);
  expect(got.a10, "bg-primary/10").toEqual([222, 245, 238]);
  expect(got.a20, "bg-primary/20").toEqual([201, 241, 231]);
  expect(got.b20, "border-primary/20").toEqual([201, 241, 231]);
});
