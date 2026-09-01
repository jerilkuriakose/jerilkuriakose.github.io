import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { globSync } from "node:fs";
import { revealAll, settle, setTheme } from "./helpers";

/**
 * Motion contract for Phase 4 (spec §7).
 *
 * Every assertion here was verified to FAIL against the pre-fix components
 * before being trusted. That step is not optional: in each of the previous three
 * phases the decisive defect turned out to be a gate that proved nothing.
 */

// ---------------------------------------------------------------------------
// Defect 2: elements settled 6px above their natural position
// ---------------------------------------------------------------------------

test("revealed elements settle at their natural position", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await revealAll(page);
  await settle(page);

  // Deliberately does NOT call lockMotion() or freezeVisuals(): lockMotion
  // injects `transform: none !important`, which would make this pass trivially.
  const offenders = await page.evaluate(() =>
    Array.from(document.querySelectorAll("main .motion-reveal"))
      .map((el) => ({
        t: getComputedStyle(el).transform,
        cls: (el.className || "").toString().slice(0, 34),
      }))
      // A settled y:0 serialises as "none" on Motion v13; some engines report the
      // 2D identity matrix instead. Both are correct. `matrix(1,0,0,1,0,-6)` is
      // the bug - measured on 92 elements in production before the fix.
      .filter(({ t }) => t !== "none" && !/^matrix\(1, 0, 0, 1, 0, 0\)$/.test(t))
      .map(({ t, cls }) => `${cls}: ${t}`),
  );
  expect(offenders, offenders.join(" | ")).toEqual([]);
});

// ---------------------------------------------------------------------------
// Defect 1: filter/blur animation. §7: "animate transform and opacity only"
// ---------------------------------------------------------------------------

test("no component animates filter, blur, masks or clip-path", () => {
  // Audit every motion-bearing component, not a hardcoded list - a future file
  // must be covered without editing this test.
  const files = globSync("components/**/*.tsx", { cwd: process.cwd() })
    .map((f) => ({ f, src: readFileSync(join(process.cwd(), f), "utf8") }))
    .filter(({ src }) => /motion\.|animate=|useSpring|useTransform/.test(src));

  expect(files.length, "expected to find motion-bearing components").toBeGreaterThan(3);

  const offenders: string[] = [];
  for (const { f, src } of files) {
    // Animated values only. Static styling is fine and deliberate: `.glass`
    // legitimately uses a static backdrop-filter, and Tailwind blur utilities
    // are static too.
    for (const pattern of [
      /filter:\s*[`"']?\s*blur/, // filter: blur(...) in a variant or style
      /\bfilter:\s*[`"']/, // any templated filter value
      /backdropFilter/,
      /WebkitFilter/,
      /maskImage/,
      /clipPath:/,
    ]) {
      if (pattern.test(src)) offenders.push(`${f} matches ${pattern}`);
    }
  }
  expect(offenders, offenders.join(" | ")).toEqual([]);
});

// ---------------------------------------------------------------------------
// Defect 3: reveals fired on load rather than on scroll
// ---------------------------------------------------------------------------

test("inView defaults to true, so reveals are observer-driven", () => {
  const src = readFileSync(
    join(process.cwd(), "components/magicui/blur-fade.tsx"),
    "utf8",
  );
  expect(src).toMatch(/inView\s*=\s*true/);
});

test("below-fold content stays hidden past the old animation budget, then reveals on scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });

  // 2600ms is past the FULL pre-fix budget for contact: 1.44s authored delay +
  // 0.04s + 0.4s duration = 1.88s. A shorter wait would catch the old
  // load-triggered animation still mid-flight, and the later scroll would let it
  // finish - "hidden before, visible after" with the observer never involved.
  await page.waitForTimeout(2600);

  const probe = page.locator("section#contact .motion-reveal").first();
  expect(
    Number(await probe.evaluate((el) => getComputedStyle(el).opacity)),
    "contact must NOT have revealed on load",
  ).toBeLessThan(0.1);

  await page.locator("section#contact").scrollIntoViewIfNeeded();
  await expect
    .poll(() => probe.evaluate((el) => Number(getComputedStyle(el).opacity)), {
      timeout: 4000,
    })
    .toBeGreaterThan(0.9);
});

test("a scrolled-to reveal completes promptly, not after a load-order delay", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2600);

  // Call sites author `delay` as document-order staggering. Uncapped, contact's
  // 1.44s meant content sat blank for ~2s AFTER being scrolled to - measured.
  await page.locator("section#contact").scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  const opacity = await page
    .locator("section#contact .motion-reveal")
    .first()
    .evaluate((el) => Number(getComputedStyle(el).opacity));
  expect(opacity, "a reveal must complete within ~900ms of coming into view").toBeGreaterThan(0.9);
});

// ---------------------------------------------------------------------------
// §7's other rule: narrative moments only, never uniform decoration
// ---------------------------------------------------------------------------

test("motion is applied at narrative moments, not to every element", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await revealAll(page);
  const count = await page.locator("main .motion-reveal").count();
  // 92 pre-audit, 33 after. The ceiling is 40 rather than a tighter number
  // because the hero's 8 staged elements, 8 experience cards and 4 featured
  // projects are 20 on their own and all three are narrative by §7's own
  // description. Headroom lets a later phase add a deliberate moment; it still
  // fails loudly if per-item decoration returns.
  expect(count, `${count} reveal wrappers - §7 forbids uniform decoration`).toBeLessThanOrEqual(40);
});

// ---------------------------------------------------------------------------
// Reduced motion, asserted PER INTERACTION (§7). A single "it's on" check would
// pass while three of the four still animated.
// ---------------------------------------------------------------------------

test("reduced motion: entrance is instant on the first frame, with no scrolling", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // No timeout before asserting. Waiting would let the ordinary delayed reveal
  // finish and the test would pass pre-fix. The CSS override must have applied
  // before any JavaScript ran.
  const opacity = await page
    .locator("section#contact .motion-reveal")
    .first()
    .evaluate((el) => Number(getComputedStyle(el).opacity));
  expect(opacity, "below-fold content must be visible immediately").toBeGreaterThan(0.99);
});

test("reduced motion: the scroll-indicator loop stops", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  // Must target the scroll indicator SPECIFICALLY. An earlier version used
  // `.motion-reveal svg` .first(), which selects a social-rail icon - a static
  // element - so it passed even with the infinite loop fully restored.
  const arrow = page.locator("div.fixed.bottom-8 [class*='motion'] , div.fixed.bottom-8 svg").first();
  await expect(arrow).toBeAttached();

  // Three UNEQUAL intervals: a two-point sample can land on equal phases of a
  // loop and read as static when it is not.
  const samples: string[] = [];
  for (const gap of [0, 230, 570]) {
    if (gap) await page.waitForTimeout(gap);
    samples.push(
      await arrow.evaluate((el) => {
        // the animated element is the motion.div wrapping the icon
        const target = el.tagName === "svg" ? el.parentElement! : el;
        return getComputedStyle(target).transform;
      }),
    );
  }
  expect(new Set(samples).size, `arrow moved: ${samples.join(" -> ")}`).toBe(1);
});

test("reduced motion: the disclosure opens instantly", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });

  const button = page.locator("section#experience button[aria-controls]").first();
  const panelId = await button.getAttribute("aria-controls");
  const panel = page.locator(`[id="${panelId}"]`);

  await button.click();
  // Sample EARLY, then compare against the settled height. An absolute floor
  // like "> 40px" is vacuous: a 0.3s height animation already exceeds 40px at
  // 50ms, so the test passed with the animation fully restored.
  await page.waitForTimeout(50);
  const early = await panel.evaluate((el) => el.getBoundingClientRect().height);
  await page.waitForTimeout(700);
  const settled = await panel.evaluate((el) => el.getBoundingClientRect().height);

  expect(settled, "panel must actually open").toBeGreaterThan(40);
  expect(
    early / settled,
    `panel was only ${Math.round((early / settled) * 100)}% open after 50ms - it animated`,
  ).toBeGreaterThan(0.95);
});

test("reduced motion: the dock does not magnify", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  // MobileDock is lg:hidden - at the default 1280 it is not rendered at all and
  // this test would be unrunnable.
  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  const icon = page.locator(".lg\\:hidden [class*='aspect-square']").first();
  const before = await icon.evaluate((el) => el.getBoundingClientRect().width);
  await icon.hover();
  // Poll across the old spring's full response window (~400ms) rather than
  // sampling immediately, which would pass before the spring reacted.
  await page.waitForTimeout(600);
  const after = await icon.evaluate((el) => el.getBoundingClientRect().width);

  expect(Math.abs(after - before), `dock icon grew ${before} -> ${after}`).toBeLessThan(2);
});

test("revealAll leaves nothing transparent, so the baseline cannot bake in blanks", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await revealAll(page);
  await settle(page);

  // The screenshot suite captures fullPage and lockMotion() neutralises transform
  // but NOT opacity. Without this guard, a silently-broken revealAll produces a
  // baseline of blank sections that every future run then matches.
  const hidden = await page.evaluate(() =>
    Array.from(document.querySelectorAll("main .motion-reveal"))
      .filter((el) => {
        const cs = getComputedStyle(el);
        // ignore anything not rendered at this breakpoint
        if (cs.display === "none" || el.getBoundingClientRect().width === 0) return false;
        return Number(cs.opacity) < 0.9;
      })
      .map((el) => (el.textContent ?? "").trim().slice(0, 30)),
  );
  expect(hidden, `still transparent after revealAll: ${hidden.join(" | ")}`).toEqual([]);
});
