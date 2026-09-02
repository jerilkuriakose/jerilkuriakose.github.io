import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CSS_PATH = join(process.cwd(), "app", "globals.css");
const CSS = readFileSync(CSS_PATH, "utf8");

/**
 * These are POST-conversion invariants. Before Task 3 runs they are expected
 * to be false, so the suite self-skips rather than reporting spurious
 * failures while capturing the pre-conversion baseline in Task 2.
 *
 * Detection is deliberately narrow: a converted file declares its tokens as
 * complete oklch() values.
 */
// Phase 0 (9747896) converted every token to OKLCH, and Phase 2 repoints the
// base tokens at semantic roles - which rewrites --background to var(--canvas).
// The old `CONVERTED = /--background:\s*oklch\(/` sniff would therefore go false
// and SKIP this whole suite while still reporting green. No pre-conversion state
// remains to support, so the gate is deleted rather than updated.
test.describe("source contract", () => {

  test("no hsl(var(...)) call sites remain", () => {
    expect(CSS.match(/hsl\(\s*var\(/g)).toBeNull();
  });

  test("no channel-triplet colour tokens remain", () => {
    // e.g. "--background: 0 0% 100%"
    expect(CSS.match(/--[a-z-]+:\s*[\d.]+\s+[\d.]+%\s+[\d.]+%/g)).toBeNull();
  });

  test("the gamut-boundary literal was retired in Phase 2", () => {
    // Phase 0 preserved hsl(166 100% 50%) because it sits on the sRGB gamut
    // boundary (R=0) and no OKLCH round-trip reproduced it at 4dp or 6dp.
    // Phase 2 retunes .gradient-text to role stops, so it is gone - and with
    // Phase 0 committed there is no reason for ANY raw hsl() to return.
    expect(CSS).not.toContain("hsl(166 100% 50%)");
    expect(CSS.match(/hsl\(/g)).toBeNull();
  });

  test("every alpha site is color-mix(in srgb) with the right percentage", () => {
    // Phase 2 rewrote these: --primary became --brand-vivid, and the two
    // --muted-foreground sites are gone entirely - they were the scrollbar
    // thumb, which measured 1.52:1 against its track and is now a solid
    // --border-strong (a meaningful non-text boundary, WCAG 1.4.11).
    //
    // Phase 5 removed the last one. `color-mix(in srgb, var(--background) 80%)`
    // was the OLD .glass fill, and §6 names it as the specific defect: an 80%
    // fill is not opaque, so with backdrop-filter unsupported busy photography
    // shows through sharply. The glass surface is now driven by per-theme
    // --glass-* tokens, so the count drops rather than moving.
    const counts = new Map<string, number>([
      // The prefix is REQUIRED: .gradient-text contains
      // `var(--brand-vivid) 50%` as a gradient STOP POSITION, which a bare
      // substring match would miscount as an alpha site.
      ["color-mix(in srgb, var(--brand-vivid) 10%", 2], // incl. --accent-tint
      ["color-mix(in srgb, var(--brand-vivid) 15%", 2],
      ["color-mix(in srgb, var(--brand-vivid) 20%", 2],
      ["color-mix(in srgb, var(--brand-vivid) 30%", 3],
      ["color-mix(in srgb, var(--brand-vivid) 50%", 2],
      ["color-mix(in srgb, var(--border) 50%", 2],
    ]);
    let total = 0;
    for (const [needle, want] of counts) {
      const found = CSS.split(needle).length - 1;
      expect(found, needle).toBe(want);
      total += found;
    }
    expect(total).toBe(13);
    // and no alpha site escaped the audit
    expect((CSS.match(/color-mix\(in srgb/g) ?? []).length).toBe(13);

    // The retired site must not come back. This is the NAMED invariant; the
    // totals above are only a census, and a census that is merely re-pinned
    // after every change stops being a contract.
    expect(CSS, "the 80% glass fill is retired").not.toContain(
      "color-mix(in srgb, var(--background) 80%",
    );
  });

  test("alpha mixing is in srgb, never oklab", () => {
    // The tokens originated as HSL. Mixing in sRGB reproduces the original
    // composited bytes exactly; mixing in oklab shifts them.
    expect(CSS).not.toContain("in oklab");
    expect((CSS.match(/color-mix\(in srgb/g) ?? []).length).toBe(13);
  });

  test("every gradient pins interpolation to srgb", () => {
    // Introducing any non-legacy stop (oklch/color-mix) flips a gradient's
    // default interpolation space from sRGB to Oklab, which measurably shifts
    // the middle of the ramp by up to 30/255. `in srgb` pins it back.
    //
    // Phase 5's glass enhancement adds the sixth: its stops are the
    // --glass-translucent/--glass-solid oklch tokens, exactly the non-legacy
    // case this rule exists for. It was authored without `in srgb` and this
    // assertion is what caught it.
    //
    // Seven and eight are the hero photo mask, emitted twice for the -webkit-
    // and standard properties. A mask gradient interpolates ALPHA, so an
    // unpinned space changes the falloff curve rather than a hue - same class of
    // silent drift, same fix.
    const gradients = CSS.match(/(linear|radial)-gradient\(/g) ?? [];
    expect(gradients.length).toBe(8);
    for (const m of CSS.matchAll(/(?:linear|radial)-gradient\(([^;]*?)\)/g)) {
      expect(m[0].slice(0, 120)).toContain("in srgb");
    }
  });

  test("--accent-tint is preserved (no consumer, but token compat)", () => {
    expect(CSS).toMatch(/--accent-tint:\s*color-mix\(in srgb, var\(--brand-vivid\)/);
  });
});

/** Runs in BOTH states: documents the migration surface. */
test("globals.css is readable and non-trivial", () => {
  expect(CSS.length).toBeGreaterThan(2000);
});
