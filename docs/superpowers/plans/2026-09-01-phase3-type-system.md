# Phase 3 — Type system — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one serif display face for headings, put **every** type-scale step on an
explicit line-height, make sizing fluid with `clamp()`, and apply the two-tone headline —
per spec §4 and §15 Phase 3.

**Architecture:** A `--font-display` token in `@theme inline` pointing at a `next/font`
provider variable, plus a small set of display classes in `globals.css` that each pin
`font-size` *and* `line-height` together. Headings opt in by class; body and UI stay Inter,
labels and metrics stay JetBrains Mono.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, Tailwind 4.3.3 (`@theme inline`), `next/font/google`.

**Spec:** §4 (type system) and §15 Phase 3. **Depends on** Phase 2, merged at `c446c38` —
the two-tone headline uses `--display-accent`, which Phase 2 defined and measured.

---

## The face: Newsreader — selected empirically, as §4 requires

§4 mandates the choice be made by rendering all four candidates in the real hero at real
sizes and deciding by looking, not by trend claim. Rendered at 1280×2 DPR on the Phase 2
canvas with the real hero strings, all six faces confirmed loaded via
`document.fonts.check()` so none silently fell back to Georgia. Artefact:
`docs/superpowers/artefacts/2026-09-01-phase3-typeface-bakeoff.png` (committed, so the
evidence for this decision outlives the session that made it).

| Candidate | Verdict |
|---|---|
| Inter (control) | Confirms §4's diagnosis — competent, voiceless |
| Instrument Serif | **Rejected.** Weight 400 only, no bold; fragile at 72px and reads fashion-editorial |
| **Newsreader** | **Selected.** Authority at 700, screen-oriented, variable with an `opsz` axis |
| Fraunces | Strong runner-up, but more expressive/"designed" than the positioning wants |
| Source Serif 4 | Sober and readable, but closest to a default serif — least differentiating |

Newsreader is the only candidate with **both** a real weight range and an optical-size axis,
so 72px display and 36px mobile receive appropriately different letterforms.

## The variable-name trap — read before touching `layout.tsx`

Tailwind 4 **generates** `--font-sans` and `--font-mono` from `@theme`. If `next/font` also
registers one of those names the result is a self-referential loop and silently broken
typography — no error, just fallback fonts. `docs/tailwind4-notes.md` records this, and the
repo already follows the safe pattern: `Inter` → `--font-inter`, `JetBrains_Mono` →
`--font-jetbrains-mono`, with `@theme inline` mapping `--font-sans: var(--font-inter), …`.

**So: register Newsreader as `--font-newsreader` and map `--font-display` to it.** Never
`variable: "--font-display"`.

## The `leading-*` trap — why every step pins its own line-height

Tailwind 4 **reversed** `text-{size}` vs `leading-*` precedence: an explicit `leading-*` now
beats the size utility's bundled line-height. On the Next 16 upgrade this silently grew the
hero `h1` from 72px to 90px. §4 calls a new type scale "exactly where it recurs", so every
step here sets `font-size` and `line-height` in the same rule and a test asserts the ratio.

---

### Task 1: Load the face and expose it as a token

**Files:** modify `app/layout.tsx`, `app/globals.css`

- [x] **Step 1: Register Newsreader in `app/layout.tsx`**

```ts
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",   // NEVER "--font-display" - see the trap above
  display: "swap",
  axes: ["opsz"],                  // the optical-size axis is why this face was chosen
});
```

Add `newsreader.variable` to the `<html>` (or `<body>`) className alongside the existing two.

- [x] **Step 2: Map the token in `@theme inline`**

```css
  --font-display: var(--font-newsreader), Georgia, "Times New Roman", serif;
```

- [x] **Step 3: Prove the face actually loads and the token resolves**

The failure mode here is silent, so assert it rather than eyeballing. Create
`tests/visual/type-contract.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

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

  // `next/font` registers its variable on <body> (layout.tsx:91), NOT on <html>.
  // So reading --font-display off documentElement resolves var(--font-newsreader)
  // to NOTHING and falls through to Georgia - while a naive
  // /Newsreader/ regex still matches the literal variable NAME in the unresolved
  // value. That test passes with the font broken. Probe a body DESCENDANT and
  // assert the USED family instead.
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
```

- [x] **Step 4: Gate** — `npm run build`, `npx tsc --noEmit`, `npm run lint`, then the two new tests. Screenshots are expected to still pass: nothing consumes `--font-display` yet.

---

### Task 2: Build the display scale with explicit line-heights

**Files:** modify `app/globals.css`

- [x] **Step 1: Add the scale**

Each step pins `font-size` **and** `line-height` in the same rule. Tighter leading as size
grows, which is why a single bundled value cannot serve the whole scale.

```css
@layer components {
  .display-1 {
    font-family: var(--font-display);
    font-size: clamp(2.25rem, 1.2rem + 5.2vw, 4.5rem);   /*  36 ->  72px */
    line-height: 1.04;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .display-2 {
    font-family: var(--font-display);
    font-size: clamp(1.875rem, 1rem + 4.4vw, 3.75rem);   /*  30 ->  60px */
    line-height: 1.08;
    font-weight: 700;
    letter-spacing: -0.015em;
  }
  .display-3 {
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 1.05rem + 2.2vw, 2.25rem);  /*  24 ->  36px */
    line-height: 1.18;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .display-4 {
    font-family: var(--font-display);
    font-size: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);  /*  20 ->  24px */
    line-height: 1.3;
    font-weight: 600;
  }
}
```

`@layer components` is deliberate: it keeps these below Tailwind utilities, so a one-off
`leading-*` or `text-*` on a specific element can still override without `!important`.

- [x] **Step 2: Assert the scale is fluid AND pinned**

Add to `type-contract.spec.ts`. This is the test that would have caught the 72→90px
regression:

```ts
// `leading` is the EXACT declared ratio, not a ceiling. An upper bound alone
// would accept a wrong-but-smaller value such as 1.0, which is precisely the
// class of silent regression this phase exists to prevent.
const STEPS = [
  { cls: "display-1", min: 36, max: 72, leading: 1.04 },
  { cls: "display-2", min: 30, max: 60, leading: 1.08 },
  { cls: "display-3", min: 24, max: 36, leading: 1.18 },
  { cls: "display-4", min: 20, max: 24, leading: 1.30 },
];

for (const { cls, min, max, leading } of STEPS) {
  test(`${cls}: fluid between ${min} and ${max}px, line-height pinned`, async ({ page }) => {
    const seen: number[] = [];
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "networkidle" });
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
        };
        el.remove();
        return out;
      }, cls);

      expect(m.size, `${cls} @${width}`).toBeGreaterThanOrEqual(min - 0.5);
      expect(m.size, `${cls} @${width}`).toBeLessThanOrEqual(max + 0.5);
      // line-height must be EXPLICIT - never `normal`, which is what a missing
      // declaration produces and what the Tailwind 4 precedence flip exploits
      expect(Number.isNaN(m.leading), `${cls} @${width} line-height is not a number`).toBe(false);
      expect(m.leading / m.size, `${cls} @${width} leading ratio`).toBeCloseTo(leading, 2);
      expect(m.family, `${cls} @${width} must use the display face`).toMatch(/Newsreader/);
      seen.push(m.size);
    }
    // genuinely fluid: 375 and 1280 must not land on the same size
    expect(seen[0]).toBeLessThan(seen[2]);
  });
}
```

- [x] **Step 3: Gate** — build, tsc, lint, the type contract. Screenshots still pass; no element uses the classes yet.

---

### Task 3: Apply the scale and the two-tone headline

**Files:** modify `components/sections/hero.tsx`, `components/sections/*.tsx`, `app/globals.css`

- [x] **Step 1: Hero — two-tone**

§4: "line one ink, line two accent teal", and calls it "the highest-leverage single move".
The hero already has the right structure — `h1` is the name, `h2` is the tagline — so this is
a class swap, not a rewrite:

- `h1` → `display-1`, colour stays `text-foreground` (ink, 14.41:1).
- `h2` → `display-2`, colour changes from `text-muted-foreground` to `text-display-accent`.

`--display-accent` on the canvas is **5.34:1** and this is large text (3:1 floor), so it
passes with margin — Phase 2 measured it. Remove the now-redundant `text-4xl sm:text-5xl
md:text-6xl lg:text-7xl` (and the `h2` equivalents): the fluid step replaces them, and
leaving both is how the precedence bug returns.

- [x] **Step 2: Fold `.numbered-heading` into the scale — including its counter**

`.numbered-heading` sets `font-size: clamp(1.5rem, 5vw, 2rem)` with **no line-height**, and
its `::before` counter sets `font-size: clamp(1rem, 3vw, 1.25rem)` — also with no
line-height. Both violate §4's rule, and the counter is a *fluid heading-related step*, so it
is inside the scale, not outside it.

Give the element `display-3`'s family, size and leading (delete its own `font-size` — do not
declare a size in two places), and give the counter an explicit `line-height: 1.18` so it
shares the element's baseline. Keep `counter-increment`, the content string, and the mono
family: the number is deliberately mono, and Phase 1a's positional numbering depends on it.

- [x] **Step 3: Map EVERY heading explicitly — no grep**

A `text-4xl…7xl` grep misses `text-lg`, `text-xl` and `text-2xl`, which is where most card
titles live. Full inventory, verified against the tree at `c446c38`:

| Element | Current size utility | Becomes |
|---|---|---|
| `hero.tsx:41` `h1` (name) | `text-4xl sm:text-5xl md:text-6xl lg:text-7xl` + `tracking-tight` | `display-1` |
| `hero.tsx:48` `h2` (tagline) | `text-3xl sm:text-4xl md:text-5xl lg:text-6xl` | `display-2` + `text-display-accent` |
| `contact.tsx:18` `h2` ("Get In Touch") | `text-4xl md:text-5xl` | `display-2` |
| `experience.tsx:10`, `selected-work.tsx:11`, `skills.tsx:9`, `publications.tsx:12`, `education-awards.tsx:23` `h2` | `.numbered-heading` | unchanged class; Step 2 gives it the scale |
| `featured-project.tsx:51` `h3` (project title) | `text-xl md:text-2xl` | `display-3` |
| `selected-work.tsx:29` `h3` ("Other Noteworthy Projects") | `text-xl` | `display-4` |
| `selected-work.tsx:43` **`h4`** (card title) | `text-lg` | `display-4` |
| `education-awards.tsx:28` / `:70` `h3` (group labels) | `text-lg` | `display-4` |
| `experience-card.tsx:28` `h3` (job title) | `text-lg` | `display-4` |
| `publications.tsx:21` `h3` (paper title) | none + **`leading-tight`** | `display-4`, **remove `leading-tight`** |
| `education-awards.tsx:36` `h3` (degree) | none | `display-4` |
| `education-awards.tsx:77` `h3` (award title) | none | `display-4` |

Note `selected-work.tsx:43` is an **`h4`**, not an `h3`.

**Remove competing utilities from every mapped heading.** Tailwind utilities sit in the
`utilities` layer and therefore beat `@layer components`, so any survivor silently wins:

- `publications.tsx:21` `leading-tight` → **delete**. It would override `display-4`'s 1.30 and the exact-ratio assertion in Task 2 would catch it — but as a failure, not a warning.
- `hero.tsx:41` `tracking-tight` → **delete**. `display-1` already declares `letter-spacing: -0.02em`.
- Every `text-*` size utility listed above → **delete**. Leaving both is precisely how the 72→90px precedence bug returns.

- [x] **Step 3b: Assert the mapping on REAL headings, not a synthetic probe**

Task 2's probe proves the classes are correct in isolation; it cannot see a utility that
overrides them on an actual element. Add to `type-contract.spec.ts`:

```ts
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
          size,
          ratio: leading / size,
          normal: s.lineHeight === "normal",
        };
      })
      .filter((h) => !/Newsreader/.test(h.family) || h.normal || h.ratio > 1.4)
      .map((h) => `${h.tag} "${h.text}" family=${h.family.slice(0, 22)} ratio=${h.ratio.toFixed(2)} normal=${h.normal}`),
  );

  expect(bad, `headings not on the display scale: ${bad.join(" | ")}`).toEqual([]);
});
```

This is the assertion that makes "all headings" a contract rather than an intention.

- [x] **Step 4: Expect screenshots to fail, and inspect all six**

Typography changed on purpose. Confirm the change is type — not a layout break, not a
reflow that clips something — at **all three widths in both themes**.

- [x] **Step 5: Gate, then regenerate**

```bash
npx playwright test type-contract.spec.ts contrast-contract.spec.ts source-contract.spec.ts token-contract.spec.ts ia-order.spec.ts evidence-schema.spec.ts
# only once those pass:
npx playwright test --update-snapshots
npx playwright test --repeat-each=3
```

The contracts passing first is what makes regeneration evidence rather than rubber-stamping.
`ia-order` matters here: it asserts heading structure, and this task touches headings.

- [x] **Step 6: `bash scripts/verify.sh`** must exit 0. Then **one commit** for Tasks 1–3.

---

### Task 4: Verify by reading, not by diffing

Verification only. **No commit.**

- [x] **Step 1:** `npx playwright test --repeat-each=3` — full suite green.
- [x] **Step 2: No competing declarations survive**

```bash
# every font-size in globals.css must have a line-height in the SAME rule.
# `grep -c` only counts and cannot prove adjacency, so print each with context:
grep -n -A4 'font-size' app/globals.css | grep -B1 -A4 'font-size'
grep -rn 'font-display' app components       # only the @theme map + the display classes
# no size OR leading utility may survive on a mapped heading:
grep -rnE '<h[1-4][^>]*(text-(xs|sm|base|lg|xl|[2-9]xl)|leading-)' components app --include='*.tsx' \
  || echo "CLEAN: no competing size/leading utility on any heading"
```

- [x] **Step 3: Read the rendered page in a real browser**, both themes, 375 and 1280.
Confirm by looking: the name renders in the serif and not a fallback; the second headline
line is teal and legible; no heading is clipped or overlapping at 375; the mono eyebrow and
metrics are unchanged; body copy is still Inter.
- [x] **Step 4:** `git status --porcelain` clean.

---

## Self-Review

**1. Spec coverage.** §4's four requirements: serif display selected empirically (recorded
above with its artefact), explicit line-height at every step (Task 2, asserted), fluid
`clamp()` (Task 2, asserted non-equal at 375 vs 1280), two-tone headline (Task 3 Step 1).
§15's variable-name instruction is honoured — Newsreader registers as `--font-newsreader`
and `--font-display` maps to it.

**2. Placeholder scan.** No TBD. Every `clamp()` carries its resolved px range in a comment;
every test asserts a measured bound rather than a shape.

**3. Type consistency.** `--font-display` is defined once in `@theme inline` and consumed
only by the four display classes. Colour roles referenced (`--display-accent`,
`text-foreground`) are the Phase 2 names, already measured.

**4. Corrections applied after Oracle review** (verdict `FIX-FIRST`; every finding verified
against the tree at `c446c38` before fixing):

| Finding | Fix |
|---|---|
| The new test file's snippet used `test`/`expect` without importing them — it would not compile | `import { test, expect } from "@playwright/test";` added |
| Heading coverage was wrong and incomplete: `selected-work.tsx:43` is an **`h4`** not an `h3`, `featured-project.tsx:51` was never named, and a `text-4xl…7xl` grep misses `text-lg`/`text-xl`/`text-2xl` | Task 3 Step 3 now maps **every** heading explicitly by file and line, and Step 3b asserts it on real rendered headings |
| The provider-variable test was vacuous: `next/font` registers on **`<body>`** (`layout.tsx:91`), so reading `--font-display` off `documentElement` resolves to the Georgia fallback while a `/Newsreader/` regex still matches the literal variable *name* — passing with the font broken | Probe a body **descendant** and assert the USED `fontFamily`, plus an explicit "not Georgia" assertion |
| `ratioMax` was an upper bound only, so a wrong-but-smaller line-height (e.g. 1.0) would pass | Asserts the exact declared ratio with `toBeCloseTo(leading, 2)` |
| Competing utilities would silently beat `@layer components`: `publications.tsx:21` `leading-tight` overrides `display-4`'s 1.30, and `hero.tsx:41` `tracking-tight` overrides `display-1`'s letter-spacing | Both deleted explicitly, and Task 4 Step 2 greps for any surviving size/leading utility on a heading |
| `.numbered-heading::before` sets a fluid `font-size` with no line-height — a heading step left outside §4's rule | Step 2 gives the counter an explicit `line-height: 1.18`; the element's own `font-size` is deleted so no size is declared twice |
| `grep -c 'font-size'` cannot prove a line-height sits beside it | Replaced with a context-printing grep |

Oracle also independently confirmed four things I had asserted: `axes: ["opsz"]` is valid for
`Newsreader` in Next 16.3.3 (`opsz` 6–72, variable `wght` 200–800, no build-time throw); the
`--font-newsreader` → `--font-display` mapping cannot be self-referential; `@layer components`
is real in Tailwind 4.3.3 and does lose to utilities; and **every `clamp()` lands inside its
stated range at 375/768/1280 with all assertions passing** (38.70/59.14/72.00,
32.50/49.79/60.00, 25.05/33.70/36.00, 20.41/23.36/24.00).

**5. Known risks.** (a) Task 3 breaks the screenshot baseline deliberately — gated on the
contracts, all six diffs inspected. (b) A serif at 36px on mobile is the most likely place
for a legibility or clipping surprise, which is why Task 4 Step 3 reads 375 specifically
rather than trusting the diff. (c) `.numbered-heading` is the one place where a size could
end up declared twice; Task 2 Step 2 and Task 4 Step 2 both check for it.
