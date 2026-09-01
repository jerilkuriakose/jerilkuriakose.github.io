import { test, expect } from "@playwright/test";

/**
 * Type-system contract for Phase 3.
 *
 * Three of these tests exist because an earlier draft of them could not fail.
 * Read the comments before "simplifying" any of them:
 *
 * - The provider-variable test probes a BODY DESCENDANT, because `next/font`
 *   registers its variable on <body>. Reading --font-display off <html>
 *   resolves var(--font-newsreader) to nothing, falls through to Georgia, and
 *   still matches a naive /Newsreader/ regex on the literal variable NAME.
 * - Line-height is asserted as an EXACT ratio, not an upper bound. A bound
 *   alone accepts a wrong-but-smaller value such as 1.0.
 * - The real-heading test exists because a synthetic probe cannot see a
 *   Tailwind utility overriding the class on an actual element - utilities sit
 *   in a later layer than @layer components and win.
 */

test("the display face loads and is not silently falling back", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('700 72px "Newsreader"'))).toBe(true);
});

test("--font-display resolves through the provider variable on a real element", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const used = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.fontFamily = "var(--font-display)";
    probe.textContent = "probe";
    document.body.appendChild(probe);
    const family = getComputedStyle(probe).fontFamily;
    probe.remove();
    return family;
  });

  expect(used).toMatch(/Newsreader/);
  expect(used, "must not have fallen through to the serif fallback").not.toMatch(/^Georgia/);
});

// `leading` is the EXACT declared ratio, not a ceiling.
const STEPS = [
  { cls: "display-1", min: 36, max: 72, leading: 1.04 },
  { cls: "display-2", min: 30, max: 60, leading: 1.08 },
  { cls: "display-3", min: 24, max: 36, leading: 1.18 },
  { cls: "display-4", min: 20, max: 24, leading: 1.3 },
];

for (const { cls, min, max, leading } of STEPS) {
  test(`${cls}: fluid between ${min} and ${max}px, line-height pinned`, async ({ page }) => {
    const seen: number[] = [];
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const m = await page.evaluate((c) => {
        const el = document.createElement("h2");
        el.className = c as string;
        el.textContent = "Measure";
        document.body.appendChild(el);
        const s = getComputedStyle(el);
        const out = {
          size: parseFloat(s.fontSize),
          leading: parseFloat(s.lineHeight),
          family: s.fontFamily,
          isNormal: s.lineHeight === "normal",
        };
        el.remove();
        return out;
      }, cls);

      expect(m.size, `${cls} @${width}px size`).toBeGreaterThanOrEqual(min - 0.5);
      expect(m.size, `${cls} @${width}px size`).toBeLessThanOrEqual(max + 0.5);
      // `normal` is what a MISSING line-height produces, and what the Tailwind 4
      // precedence flip exploits.
      expect(m.isNormal, `${cls} @${width}px line-height is 'normal'`).toBe(false);
      expect(m.leading / m.size, `${cls} @${width}px leading ratio`).toBeCloseTo(leading, 2);
      expect(m.family, `${cls} @${width}px must use the display face`).toMatch(/Newsreader/);
      seen.push(m.size);
    }
    // genuinely fluid: 375 and 1280 must not land on the same size
    expect(seen[0], "must scale between 375 and 1280").toBeLessThan(seen[2]);
  });
}

test("every heading uses the display face with an explicit line-height", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const bad = await page.evaluate(() =>
    Array.from(document.querySelectorAll("main h1, main h2, main h3, main h4"))
      .map((el) => {
        const s = getComputedStyle(el);
        const size = parseFloat(s.fontSize);
        const leading = parseFloat(s.lineHeight);
        return {
          tag: el.tagName,
          text: (el.textContent ?? "").trim().slice(0, 28),
          family: s.fontFamily,
          ratio: leading / size,
          normal: s.lineHeight === "normal",
        };
      })
      .filter((h) => !/Newsreader/.test(h.family) || h.normal || h.ratio > 1.4)
      .map(
        (h) =>
          `${h.tag} "${h.text}" family=${h.family.slice(0, 22)} ratio=${h.ratio.toFixed(2)} normal=${h.normal}`,
      ),
  );

  expect(bad, `headings not on the display scale: ${bad.join(" | ")}`).toEqual([]);
});
