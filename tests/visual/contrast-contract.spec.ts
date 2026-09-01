import { test, expect } from "@playwright/test";
import { sample8bit, setTheme, type Theme } from "./helpers";

/**
 * Contrast contract for the Phase 2 role graph.
 *
 * Four things here are deliberate, each one a defect an earlier draft of the
 * plan shipped:
 *
 * 1. setTheme() runs BEFORE goto(). It only installs an init script, so calling
 *    it afterwards samples the wrong theme (helpers.ts:5).
 * 2. FLOORS is keyed BY THEME. A single shared table is unsatisfiable: ink on
 *    panel is 12.61:1 in dark and 1.14:1 in light.
 * 3. Colour comes from sample8bit(), never from parsing
 *    getComputedStyle().color - which returns oklch(...) verbatim.
 * 4. The ramp is checked for GAMUT by round-trip, not just for monotonicity.
 *    An out-of-gamut OKLCH colour is gamut-mapped rather than clamped, so a
 *    monotonic, all-distinct ramp can still be partly outside sRGB - which is
 *    exactly what happened.
 */

type RGB = readonly [number, number, number];

const rgb = (px: number[]): RGB => [px[0], px[1], px[2]];

function relLuminance([r, g, b]: RGB): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(a: RGB, b: RGB): number {
  const [hi, lo] = [relLuminance(a), relLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** [foreground, background, floor, why] */
type Pair = [string, string, number, string];

const FLOORS: Record<Theme, Pair[]> = {
  light: [
    ["--ink", "--canvas", 7, "body text AAA"],
    ["--ink", "--surface-muted", 4.5, "text on the muted surface"],
    ["--ink-muted", "--canvas", 4.5, "secondary text"],
    ["--interactive", "--canvas", 4.5, "links and small text"],
    ["--interactive", "--surface-muted", 4.5, "links on the muted surface"],
    ["--display-accent", "--canvas", 3, "large display text"],
    ["--on-brand", "--brand-vivid", 4.5, "text on a brand fill"],
    ["--border-strong", "--canvas", 3, "control boundaries, WCAG 1.4.11"],
    ["--border-strong", "--surface-muted", 3, "control boundaries on muted"],
    ["--focus", "--canvas", 3, "focus ring vs canvas"],
    ["--focus", "--surface-muted", 3, "focus ring vs muted"],
    ["--destructive-role", "--canvas", 4.5, "error text"],
    ["--destructive-role", "--surface-muted", 4.5, "error text on muted"],
    ["--destructive-role-foreground", "--destructive-role", 4.5, "text on an error fill"],
  ],
  dark: [
    ["--ink", "--canvas", 7, "body text AAA"],
    ["--ink", "--surface-muted", 4.5, "text on the muted surface"],
    ["--ink-muted", "--canvas", 4.5, "secondary text"],
    // on dark, brand-vivid IS legal as text - interactive points at it
    ["--interactive", "--canvas", 4.5, "links and small text"],
    ["--interactive", "--surface-muted", 4.5, "links on the muted surface"],
    ["--display-accent", "--canvas", 3, "large display text"],
    ["--on-brand", "--brand-vivid", 4.5, "text on a brand fill"],
    ["--border-strong", "--canvas", 3, "control boundaries, WCAG 1.4.11"],
    ["--border-strong", "--surface-muted", 3, "control boundaries on muted"],
    ["--focus", "--canvas", 3, "focus ring vs canvas"],
    ["--focus", "--surface-muted", 3, "focus ring vs muted"],
    ["--destructive-role", "--canvas", 4.5, "error text"],
    ["--destructive-role-foreground", "--destructive-role", 4.5, "text on an error fill"],
  ],
};

/** Roles the .on-panel scope re-points, checked against the panel surface. */
const PANEL_PAIRS: Pair[] = [
  ["--teal-100", "--panel", 4.5, "scoped ink on the panel"],
  ["--teal-300", "--panel", 4.5, "scoped ink-muted on the panel"],
  ["--teal-400", "--panel", 4.5, "scoped interactive on the panel"],
  ["--teal-500", "--panel", 3, "scoped border-strong on the panel"],
];

for (const theme of ["light", "dark"] as const) {
  test(`contrast floors hold: ${theme}`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveClass(
      theme === "dark" ? /dark/ : /^(?!.*\bdark\b).*$/,
    );

    for (const [fg, bg, floor, why] of FLOORS[theme]) {
      const r = ratio(
        rgb(await sample8bit(page, `var(${fg})`)),
        rgb(await sample8bit(page, `var(${bg})`)),
      );
      expect(
        Number(r.toFixed(2)),
        `${theme}: ${fg} on ${bg} (${why}) = ${r.toFixed(2)}:1, floor ${floor}`,
      ).toBeGreaterThanOrEqual(floor);
    }
  });
}

test("panel-scoped roles clear their floors against the panel", async ({
  page,
}) => {
  await setTheme(page, "light");
  await page.goto("/", { waitUntil: "networkidle" });

  for (const [fg, bg, floor, why] of PANEL_PAIRS) {
    const r = ratio(
      rgb(await sample8bit(page, `var(${fg})`)),
      rgb(await sample8bit(page, `var(${bg})`)),
    );
    expect(
      Number(r.toFixed(2)),
      `${fg} on ${bg} (${why}) = ${r.toFixed(2)}:1, floor ${floor}`,
    ).toBeGreaterThanOrEqual(floor);
  }
});

test(".on-panel actually re-points the roles it must", async ({ page }) => {
  await setTheme(page, "light");
  await page.goto("/", { waitUntil: "networkidle" });

  // The floors above prove the VALUES are safe; this proves the SCOPE assigns
  // them. Without it, a correct table could sit next to a scope that never
  // applies.
  const resolved = await page.evaluate(() => {
    const wrap = document.createElement("div");
    wrap.className = "on-panel";
    const inner = document.createElement("span");
    wrap.appendChild(inner);
    document.body.appendChild(wrap);
    const read = (el: Element, prop: string) =>
      getComputedStyle(el).getPropertyValue(prop).trim();
    const out = {
      rootInk: read(document.documentElement, "--ink"),
      scopedInk: read(inner, "--ink"),
      scopedInteractive: read(inner, "--interactive"),
      scopedBorder: read(inner, "--border-strong"),
      teal100: read(document.documentElement, "--teal-100"),
      teal400: read(document.documentElement, "--teal-400"),
      teal500: read(document.documentElement, "--teal-500"),
    };
    wrap.remove();
    return out;
  });

  // inherited into a descendant, not just set on the scope element
  expect(resolved.scopedInk).not.toBe(resolved.rootInk);
  expect(resolved.scopedInk).toBe(resolved.teal100);
  expect(resolved.scopedInteractive).toBe(resolved.teal400);
  expect(resolved.scopedBorder).toBe(resolved.teal500);
});

test(".on-panel reaches the BASE tokens, so real utilities are corrected", async ({
  page,
}) => {
  await setTheme(page, "light");
  await page.goto("/", { waitUntil: "networkidle" });

  // The role-level test above is NOT sufficient. `--muted-foreground:
  // var(--ink-muted)` is declared on :root, so its var() resolves AT :root and
  // the resolved colour inherits - overriding --ink-muted in a scope does not
  // change it. Before .on-panel re-declared the base tokens, a
  // `text-foreground` child inside the scope still painted near-black ink on
  // the deep panel at 1.14:1 while --ink had correctly flipped.
  //
  // So assert the PAINTED colour of real utilities, not the custom properties.
  const painted = await page.evaluate(() => {
    const wrap = document.createElement("div");
    wrap.className = "on-panel";
    const mk = (cls: string) => {
      const el = document.createElement("span");
      el.className = cls;
      el.textContent = "x";
      wrap.appendChild(el);
      return el;
    };
    const fg = mk("text-foreground");
    const muted = mk("text-muted-foreground");
    document.body.appendChild(wrap);

    const toBytes = (colour: string) => {
      const c = document.createElement("canvas");
      c.width = 1;
      c.height = 1;
      const ctx = c.getContext("2d", { willReadFrequently: true })!;
      ctx.fillStyle = colour;
      ctx.fillRect(0, 0, 1, 1);
      return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
    };
    const out = {
      foreground: toBytes(getComputedStyle(fg).color),
      mutedForeground: toBytes(getComputedStyle(muted).color),
      panel: toBytes(
        getComputedStyle(document.documentElement).getPropertyValue("--panel"),
      ),
    };
    wrap.remove();
    return out;
  });

  const panel = rgb(painted.panel);
  const fgRatio = ratio(rgb(painted.foreground), panel);
  const mutedRatio = ratio(rgb(painted.mutedForeground), panel);

  expect(
    Number(fgRatio.toFixed(2)),
    `text-foreground inside .on-panel = ${fgRatio.toFixed(2)}:1 against the panel`,
  ).toBeGreaterThanOrEqual(4.5);
  expect(
    Number(mutedRatio.toFixed(2)),
    `text-muted-foreground inside .on-panel = ${mutedRatio.toFixed(2)}:1 against the panel`,
  ).toBeGreaterThanOrEqual(4.5);
});

test("brand-vivid is illegal as text on the light canvas at ANY size", async ({
  page,
}) => {
  await setTheme(page, "light");
  await page.goto("/", { waitUntil: "networkidle" });
  const r = ratio(
    rgb(await sample8bit(page, "var(--brand-vivid)")),
    rgb(await sample8bit(page, "var(--canvas)")),
  );
  // 1.80:1 - below even the 3:1 large-text floor, so there is no size
  // exemption anywhere in this phase. If this ever reaches 3, the palette
  // changed and every fill-only decision needs revisiting.
  expect(r).toBeLessThan(3);
});

const RAMP = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

/**
 * The AUTHORED OKLCH of each ramp step, pinned here on purpose.
 *
 * These cannot be read back from the computed custom property: the build
 * (lightningcss, via Next) downlevels authored `oklch()` into a hex fallback
 * plus a `lab()` value, so the built stylesheet contains zero `oklch(` and
 * `getComputedStyle().getPropertyValue("--teal-400")` returns
 * `lab(75.5985% -51.509 8.38922)`. Pinning is also stricter: it asserts the
 * value we INTENDED survives to the screen, not merely that the build was
 * self-consistent.
 */
const AUTHORED: Record<number, { L: number; C: number }> = {
  100: { L: 0.977, C: 0.006 },
  200: { L: 0.93, C: 0.022 },
  300: { L: 0.86, C: 0.07 },
  400: { L: 0.773, C: 0.147 },
  500: { L: 0.66, C: 0.128 },
  600: { L: 0.55, C: 0.107 },
  700: { L: 0.44, C: 0.0862 },
  800: { L: 0.35, C: 0.068 },
  900: { L: 0.26, C: 0.03 },
};

test("the ramp is luminance-monotonic and every step is distinct", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });

  const sampled: RGB[] = [];
  for (const step of RAMP) {
    sampled.push(rgb(await sample8bit(page, `var(--teal-${step})`)));
  }

  for (let i = 1; i < sampled.length; i++) {
    expect(
      relLuminance(sampled[i]),
      `--teal-${RAMP[i]} must be darker than --teal-${RAMP[i - 1]}`,
    ).toBeLessThan(relLuminance(sampled[i - 1]));
  }
  expect(new Set(sampled.map((p) => p.join(","))).size, "steps collapsed").toBe(
    RAMP.length,
  );
});

test("every ramp step is inside the sRGB gamut (round-trip)", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });

  // Monotonic + all-distinct CANNOT detect a gamut violation: the browser
  // gamut-maps rather than clamping, so out-of-gamut steps still render as
  // distinct, ordered colours. Only a round-trip catches it - render the
  // colour, then ask the engine what OKLCH the rendered bytes actually are.
  const drift = await page.evaluate((authored) => {
    const read = (css: string) => {
      const probe = document.createElement("div");
      probe.style.color = css;
      document.body.appendChild(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    };
    const parse = (s: string) => {
      const m = s.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
      return m ? { L: +m[1], C: +m[2], H: +m[3] } : null;
    };
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

    return (authored as { step: number; L: number; C: number }[]).map(
      ({ step, L, C }) => {
        ctx.fillStyle = read(`var(--teal-${step})`);
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
        const back = parse(read(`oklch(from rgb(${r} ${g} ${b}) l c h)`));
        return back
          ? { step, dC: +(C - back.C).toFixed(4), dL: +(L - back.L).toFixed(4) }
          : { step, dC: NaN, dL: NaN };
      },
    );
  }, RAMP.map((step) => ({ step, ...AUTHORED[step] })));

  for (const { step, dC, dL } of drift) {
    // Hue is deliberately NOT gated: at C~0.006 the angle is ill-conditioned
    // and 8-bit rounding swings it ~0.8 degrees, which would false-positive on
    // --teal-100/200/300.
    expect(
      Math.abs(dC),
      `--teal-${step} chroma was gamut-mapped by ${dC} - authored value is outside sRGB`,
    ).toBeLessThan(0.001);
    expect(
      Math.abs(dL),
      `--teal-${step} lightness drifted by ${dL}`,
    ).toBeLessThan(0.004);
  }
});

for (const theme of ["light", "dark"] as const) {
  test(`REAL .on-panel surfaces on the page are legible: ${theme}`, async ({
    page,
  }) => {
    await setTheme(page, theme);
    await page.goto("/", { waitUntil: "networkidle" });

    // The two tests above prove the scope MECHANISM. This proves it is actually
    // applied to a live surface - a correct scope nobody uses protects nothing.
    const count = await page.locator(".on-panel").count();
    expect(count, "the page must have at least one panel surface").toBeGreaterThan(0);

    const sampled = await page.evaluate(() => {
      const toBytes = (colour: string) => {
        const c = document.createElement("canvas");
        c.width = 1;
        c.height = 1;
        const ctx = c.getContext("2d", { willReadFrequently: true })!;
        ctx.fillStyle = colour;
        ctx.fillRect(0, 0, 1, 1);
        return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
      };
      return Array.from(document.querySelectorAll(".on-panel")).map((panel) => {
        const bg = toBytes(getComputedStyle(panel).backgroundColor);
        const texts = Array.from(
          panel.querySelectorAll(".text-muted-foreground, .text-foreground"),
        ).map((t) => toBytes(getComputedStyle(t).color));
        return { bg, texts };
      });
    });

    for (const [i, { bg, texts }] of sampled.entries()) {
      for (const fg of texts) {
        const r = ratio(rgb(fg), rgb(bg));
        expect(
          Number(r.toFixed(2)),
          `${theme}: panel #${i} text = ${r.toFixed(2)}:1 against its own background`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
}

test("a first-time visitor with no stored theme gets LIGHT", async ({ page }) => {
  // The screenshot suite forces a theme via setTheme(), so it can never prove
  // defaultTheme changed. Deliberately do NOT call setTheme here.
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  // and the canvas really is the off-white, not white
  const canvas = rgb(await sample8bit(page, "var(--background)"));
  expect(canvas).toEqual([244, 249, 247]);
});

test("viewport themeColor matches the new canvas and panel", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const metas = await page.$$eval('meta[name="theme-color"]', (els) =>
    els.map((e) => ({
      media: e.getAttribute("media"),
      color: e.getAttribute("content"),
    })),
  );
  expect(metas).toEqual([
    { media: "(prefers-color-scheme: light)", color: "#F4F9F7" },
    { media: "(prefers-color-scheme: dark)", color: "#17342D" },
  ]);
});

for (const theme of ["light", "dark"] as const) {
  test(`keyboard focus produces a >=3:1 indicator: ${theme}`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto("/", { waitUntil: "networkidle" });
    await page.keyboard.press("Tab");

    // Components carry `focus-visible:ring-2 ring-ring`, so the real indicator
    // is a BOX-SHADOW ring, not the outline: a global `outline: 2px dashed
    // var(--focus)` rule also exists but its colour resolves to currentColor
    // through the shorthand cascade - pre-existing behaviour, identical before
    // Phase 2 when the same rule used var(--primary).
    //
    // So assert what actually renders: the ring band coloured by --ring.
    const found = await page.evaluate(() => {
      const el = document.activeElement!;
      const s = getComputedStyle(el);
      const ring = s.getPropertyValue("--tw-ring-color").trim();
      const bytes = (colour: string) => {
        const c = document.createElement("canvas");
        c.width = 1;
        c.height = 1;
        const ctx = c.getContext("2d", { willReadFrequently: true })!;
        ctx.fillStyle = colour;
        ctx.fillRect(0, 0, 1, 1);
        return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
      };
      return {
        hasRingBand: /0px 0px 0px 4px/.test(s.boxShadow),
        ring: ring ? bytes(ring) : null,
        canvas: bytes(
          getComputedStyle(document.documentElement).getPropertyValue("--canvas"),
        ),
      };
    });

    expect(found.hasRingBand, "focused element must render a ring band").toBe(true);
    expect(found.ring, "--tw-ring-color must be set").not.toBeNull();
    const r = ratio(rgb(found.ring as number[]), rgb(found.canvas));
    expect(
      Number(r.toFixed(2)),
      `${theme}: focus ring = ${r.toFixed(2)}:1 against the canvas`,
    ).toBeGreaterThanOrEqual(3);
  });
}
