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
const CONVERTED = /--background:\s*oklch\(/.test(CSS);
const why = "pre-conversion: Task 3 has not run yet";

test.describe("source contract (post-conversion)", () => {
  test.skip(!CONVERTED, why);

  test("no hsl(var(...)) call sites remain", () => {
    expect(CSS.match(/hsl\(\s*var\(/g)).toBeNull();
  });

  test("no channel-triplet colour tokens remain", () => {
    // e.g. "--background: 0 0% 100%"
    expect(CSS.match(/--[a-z-]+:\s*[\d.]+\s+[\d.]+%\s+[\d.]+%/g)).toBeNull();
  });

  test("the gamut-boundary gradient literal is deliberately untouched", () => {
    // hsl(166 100% 50%) renders [0,255,195] but every OKLCH round-trip
    // yields [0,255,196] at 4dp AND 6dp - it sits on the sRGB gamut
    // boundary (R=0) and cannot be converted without changing a pixel.
    expect(CSS).toContain("hsl(166 100% 50%)");
  });

  test("all 16 alpha sites are color-mix with the right percentages", () => {
    const counts = new Map<string, number>([
      ["var(--muted-foreground) 30%", 2],
      ["var(--muted-foreground) 50%", 1],
      ["var(--primary) 10%", 1],
      ["var(--primary) 15%", 2],
      ["var(--primary) 20%", 2],
      ["var(--primary) 30%", 3],
      ["var(--primary) 50%", 2],
      ["var(--border) 50%", 2],
      ["var(--background) 80%", 1],
    ]);
    let total = 0;
    for (const [needle, want] of counts) {
      const found = CSS.split(needle).length - 1;
      expect(found, needle).toBe(want);
      total += found;
    }
    expect(total).toBe(16);
  });

  test("--accent-tint is preserved (no consumer, but token compat)", () => {
    expect(CSS).toMatch(/--accent-tint:\s*color-mix\(/);
  });
});

/** Runs in BOTH states: documents the migration surface. */
test("globals.css is readable and non-trivial", () => {
  expect(CSS.length).toBeGreaterThan(2000);
});
