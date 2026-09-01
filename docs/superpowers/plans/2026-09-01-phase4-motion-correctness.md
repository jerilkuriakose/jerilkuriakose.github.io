# Phase 4 — Motion correctness — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the three real defects in `BlurFade`, delete `BlurFadeText`, and implement
`prefers-reduced-motion` **per interaction** — per spec §7 and §15 Phase 4.

**Architecture:** Keep `BlurFade`'s public interface and stay inside `motion` v13 (spec §7:
"retain the existing component"; the motion-performance skill's tool-boundary rule forbids
migrating animation libraries). Change only its *default effect* and add Motion's own
`useReducedMotion()` hook at each of the four animated interactions.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, `motion` 13.1.1 (imported from `motion/react`), `@playwright/test` 1.62.1.

**Spec:** §7 (Motion) and §15 Phase 4. **Depends on** Phase 1a for the extracted client leaves
(`scroll-indicator`, `mobile-dock`, `experience-card`), merged at `d926de5`.

---

## The three defects, quoted

Spec §7 names them and insists all three are fixed together — "setting `inView` without
fixing 1 and 2 is not sufficient":

1. **It animates `filter`.** `blur-fade.tsx` goes `blur(6px) → blur(0px)` on ~30 elements,
   several of which wrap whole sections. The motion-performance skill's rule 7 is explicit:
   never animate blur on large surfaces, and prefer opacity/translate before blur. Spec §7's
   rules are stricter still — "animate `transform` and `opacity` only".
2. **It never returns to its natural position.** `visible` ends at `y: -yOffset`, so every
   wrapped element settles **6px above** where it belongs.
3. **`inView` defaults to `false`** and nothing sets it, so `isInView = !inView || …` is
   permanently `true` and all ~30 entrances fire on load rather than on scroll.

`BlurFadeText` animates 8px of blur **per character**, creating many paint-heavy layers. It is
imported by nothing. Spec §7: "do not adopt it; delete it."

## Reduced motion — four interactions, four different outcomes

`prefers-reduced-motion` is absent from the codebase entirely. §7 requires the reduced outcome
be specified *per interaction*, not a blanket disable:

| Interaction | File | Reduced outcome |
|---|---|---|
| Entrance reveals | `magicui/blur-fade.tsx` | **Instant** — no translate, no fade |
| Scroll-indicator loop | `chrome/scroll-indicator.tsx` | **Loop stops** |
| Disclosure height | `sections/experience-card.tsx` | **Instant** open/close |
| Dock magnification | `magicui/dock.tsx` | **Disabled** |

Use Motion's `useReducedMotion()` — in-stack. **It is not reactive:** the installed 13.1.1
implementation is `useState(prefersReducedMotion.current)` with **no setter**, so it samples once
at mount and a later preference change does not re-render. It also reads a module ref that is
unset on the server, so it returns `null` during SSR. Both facts shape the design below.

## The screenshot hazard this phase creates

Fixing defect 3 makes reveals scroll-triggered. The suite captures `fullPage: true`, and
`lockMotion()` injects `transform: none` but does **not** touch `opacity` — so every below-fold
element would screenshot at `opacity: 0`. The baseline would bake in invisible content and the
regression would look like a pass.

`useInView` is configured `{ once: true }`, so a single pass down the document permanently
reveals everything. Task 4 adds a `revealAll()` helper that scrolls to the bottom, waits, and
returns to the top **before** `settle()`.

---

### Task 1: Fix `BlurFade` and delete `BlurFadeText`

**Files:** modify `components/magicui/blur-fade.tsx`; delete `components/magicui/blur-fade-text.tsx`

- [ ] **Step 1: Confirm `BlurFadeText` is genuinely unreferenced, then delete it**

```bash
grep -rn 'BlurFadeText\|blur-fade-text' app components tests --include='*.tsx' --include='*.ts'
```

Expected: only the file itself. Then `git rm components/magicui/blur-fade-text.tsx`.

- [ ] **Step 2: Rewrite the variants — opacity and transform only**

```tsx
const defaultVariants: Variants = {
  hidden: { y: yOffset, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};
```

Three changes in three lines: `filter` is gone from both variants, `visible.y` is `0` rather
than `-yOffset`, and `hidden` keeps the offset so there is still a reveal.

**Keep `blur` in `BlurFadeProps`** but **stop destructuring it** — an unused binding is an
ESLint error and `verify.sh` treats lint as a gate. Mark it `@deprecated` in the interface so
nobody re-wires it. Spec §7 permits retaining the interface while the default effect changes,
and no call site passes it.

- [ ] **Step 3: Flip `inView` to default `true`**

```tsx
inView = true,
```

One default, not 30 call-site edits. `isInView = !inView || inViewResult` then correctly defers
to the observer.

**Also fix `inViewMargin`.** It defaults to `"-50px"`, which shrinks **all four** root edges — so
an element wholly inside the first 50px of the document can never intersect while scrolling
down, and never reveals. Change the default to bottom-only:

```tsx
inViewMargin = "0px 0px -50px 0px",
```

and type the prop to Motion's accepted margin type instead of hiding an arbitrary string behind
`as \`${number}px\``.

- [ ] **Step 4: Add reduced motion — CSS first, hook second**

The obvious version of this is wrong. `useReducedMotion()` returns `null` on the server but
`true` immediately on a reduced-motion client, so gating `initial` on it makes the **server HTML
render hidden** and the client hydrate from a different prop — a React mismatch *and* a visible
flash before JS runs. "Instant, never hidden" then fails exactly where it matters most.

So the guarantee lives in CSS, which applies before any JavaScript:

```css
/* globals.css - the reduced-motion guarantee. CSS wins the race with JS, so a
   reduced-motion visitor never receives a hidden or translated first paint. */
@media (prefers-reduced-motion: reduce) {
  .motion-reveal {
    opacity: 1 !important;
    transform: none !important;
  }
}
```

Then keep the React props **identical on server and client** — no `shouldReduce` in `initial`:

```tsx
const shouldReduce = useReducedMotion();
// ...
<motion.div
  className="motion-reveal"
  initial="hidden"
  animate={isInView ? "visible" : "hidden"}
  transition={
    shouldReduce
      ? { duration: 0 }
      : { delay: 0.04 + delay, duration, ease: "easeOut" }
  }
```

The hook now only zeroes the *transition duration* after hydration, which is safe because the
CSS has already forced the visual end state. No mismatch, no flash.

**Also give the `motion.div` the `className="motion-reveal"` hook** — the CSS rule above and the
Task 3 assertions both select on it. Merge it with any incoming `className` rather than
replacing it.

- [ ] **Step 5: Gate** — `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean.

---

### Task 2: Reduced motion at the other three interactions

**Files:** modify `components/chrome/scroll-indicator.tsx`, `components/sections/experience-card.tsx`, `components/magicui/dock.tsx`

- [ ] **Step 1: Scroll indicator — stop the loop**

It runs `animate={{ y: [0, 8, 0] }}` with `repeat: Infinity`. Under reduced motion, render the
arrow static: no `animate`, no `transition`. An infinite loop is the single most disruptive
motion on the page for a vestibular-sensitive user.

- [ ] **Step 2: Disclosure — instant open/close**

Two animations here, and **both** need it: the panel's `height`/`opacity` (currently
`duration: 0.3`) and the chevron's `rotate` (`duration: 0.2`). Set `duration: 0` for both when
reduced. The panel still opens — only the animation is removed.

Note the panel animates `height`, which is layout-triggering. It is a small, isolated,
one-shot, user-initiated surface, which the motion-performance skill's rule 2 permits
explicitly. Do **not** convert it to a transform-based reveal: that changes the interaction and
is outside this phase.

- [ ] **Step 3: Dock — disable magnification**

`dock.tsx` drives icon width from pointer distance via `useTransform` + `useSpring`. Do **not**
"bypass the spring" by calling hooks conditionally — that breaks the rules of hooks. Call both
unconditionally and switch at the consumption point:

```tsx
const shouldReduce = useReducedMotion();
const widthSync = useTransform(/* …unchanged… */);
const width = useSpring(widthSync, { /* …unchanged… */ });
// a plain number is valid Motion style input, so no MotionValue type error
<motion.div style={{ width: shouldReduce ? DEFAULT_SIZE : width }} />
```

Use the component's existing resting-size constant rather than a literal. This removes the
*magnification*, not the dock — it stays mounted and interactive.

- [ ] **Step 4: Gate** — tsc, lint, build clean.

---

### Task 2b: Narrative-motion audit — §7's other rule

§7's Rules paragraph is two sentences, and the plan originally implemented only the first:

> Animate `transform` and `opacity` only. **Motion at narrative moments only — never uniform
> decoration on every element.**

Measured on production: **92** elements carry a reveal transform. `skills.tsx` wraps **each of
40 skill chips** in its own `BlurFade`; `social-rail.tsx` wraps **each social link**;
publications, awards and education wrap **every item**. That is the definition of uniform
decoration, and no amount of fixing the *effect* satisfies the rule while the *distribution*
stays.

**Files:** modify `components/sections/skills.tsx`, `components/chrome/social-rail.tsx`, `components/sections/publications.tsx`, `components/sections/education-awards.tsx`, `components/sections/selected-work.tsx`

- [ ] **Step 1: Inventory the reveal sites**

```bash
grep -rn '<BlurFade' components --include='*.tsx' | sed 's|components/||'
```

- [ ] **Step 2: Keep section-level reveals, remove per-item ones**

Retain a reveal on: the hero's staged content, each `<section>`'s heading, and each *featured
project* (four narrative moments). Remove the per-item wrapper from: skill chips, social rail
links, publication rows, award cards, education rows, and the "other noteworthy" grid.

Where a container previously staggered its children, wrap the **container** once instead. The
list still arrives with the section; the individual items no longer each stage in.

- [ ] **Step 3: Assert the distribution, not just the effect**

```ts
test("motion is applied at narrative moments, not to every element", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await revealAll(page);
  const count = await page.locator("main .motion-reveal").count();
  // 92 pre-audit. A ceiling, not an exact number, so later phases can add a
  // deliberate moment without editing this test - but not 40 of them.
  expect(count, `${count} reveal wrappers - §7 forbids uniform decoration`).toBeLessThanOrEqual(20);
});
```

- [ ] **Step 4: Gate** — tsc, lint, build clean. Expect the screenshot baseline to move here too; it is regenerated once, in Task 4.

---

### Task 3: The motion contract

**Files:** create `tests/visual/motion-contract.spec.ts`

Each assertion below targets one of the defects; each must be verified to FAIL against the
pre-fix code before it is trusted.

- [ ] **Step 1: Assert the settled position is identity, not −6px**

The regression this phase's headline defect represents:

```ts
test("revealed elements settle at their natural position", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await revealAll(page);
  await settle(page);

  const offenders = await page.evaluate(() =>
    Array.from(document.querySelectorAll("main .motion-reveal"))
      .map((el) => ({ t: getComputedStyle(el).transform, cls: el.className.slice(0, 30) }))
      // matrix(1,0,0,1,0,-6) is the bug; "none" or an identity matrix is correct
      .filter(({ t }) => t !== "none" && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(t))
      .map(({ t, cls }) => `${cls}: ${t}`),
  );
  expect(offenders, offenders.join(" | ")).toEqual([]);
});
```

**This test must not run `lockMotion()` or `freezeVisuals()` first.** `lockMotion()` injects
`transform: none !important`, which would make the assertion pass trivially and prove nothing.
`freezeVisuals()` does not override transforms, but keep both out for clarity. Motion v13
serialises a settled `y: 0` as `transform: none`; some engines report the 2D identity matrix
instead, so accept either. The current `y: -6` reports `matrix(1, 0, 0, 1, 0, -6)`.

Measured on production before the fix: **92** elements carry `matrix(1, 0, 0, 1, 0, -6)` and
**93** carry a residual `filter: blur(0px)` — the spec estimated ~30, so the real blast radius is
three times larger. Each non-`none` filter also creates a containing block and promotes a
compositing layer for zero visual effect.

- [ ] **Step 2: Assert no filter animation survives, anywhere**

```ts
test("no component animates filter or blur", () => {
  const src = ["blur-fade.tsx", "dock.tsx", "scroll-indicator.tsx", "experience-card.tsx"]
    .map((f) => readFileSync(join(process.cwd(), "components", f.includes("magicui") ? "magicui" : "", f), "utf8"))
    .join("\n");
  expect(src).not.toMatch(/filter:\s*[`"']?blur/);
  expect(src).not.toMatch(/backdrop-filter/);
});
```

Resolve the real paths rather than the sketch above — `dock.tsx` and `blur-fade.tsx` live in
`components/magicui/`, the other two do not.

**Audit every motion-bearing file, not a hardcoded list of four**, and cover more than one
spelling. Glob `components/**/*.tsx`, keep the files that match `motion\.|animate=|useSpring|
useTransform`, and assert none contains an animated `filter`, `backdropFilter`,
`WebkitFilter`, `maskImage` or `clipPath`. Distinguish **static** styling from animation:
`.glass` legitimately uses a static `backdrop-filter`, and `bg-blur`-style utilities are static
too — only animated values are forbidden. A source assertion is right here because the point is
that no future edit reintroduces one, which a rendered check cannot express.

- [ ] **Step 3: Assert reveals are scroll-triggered — with the timing that makes it real**

The naive version of this test **passes against the unfixed component.** Contact's reveal
carries `delay: BLUR_FADE_DELAY * 36` = 1.44s, plus 0.04s and a 0.4s duration — **1.88s total**.
Sampling at 1500ms catches the *old load-triggered* animation while it is still mid-flight and
therefore still faint, and the subsequent scroll-and-wait lets that same load animation finish.
"Hidden before, visible after" with the observer never involved: the exact vacuous gate this
phase is meant to stop shipping.

So wait past the entire old budget before asserting, and pair the behavioural check with a
source contract on the default:

```ts
test("inView defaults to true, so reveals are observer-driven", () => {
  const src = readFileSync(join(process.cwd(), "components/magicui/blur-fade.tsx"), "utf8");
  expect(src).toMatch(/inView\s*=\s*true/);
});

test("below-fold content stays hidden past the old animation budget, then reveals on scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });

  // 2600ms > 1.88s, the full delay+duration of contact's reveal. If the old
  // load-triggered code were still in place, contact would be fully visible by
  // now and this assertion would fail - which is what makes it meaningful.
  await page.waitForTimeout(2600);

  const probe = page.locator("section#contact .motion-reveal").first();
  expect(
    Number(await probe.evaluate((el) => getComputedStyle(el).opacity)),
    "contact must NOT have revealed on load",
  ).toBeLessThan(0.1);

  await page.locator("section#contact").scrollIntoViewIfNeeded();
  await expect
    .poll(() => probe.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 4000 })
    .toBeGreaterThan(0.9);
});
```

Contact is unambiguously below the fold at 1280×900: the hero alone is `min-h-screen`, and
Experience, Selected work, Skills, Publications and Education + Awards all precede it.

- [ ] **Step 4: Assert each reduced-motion outcome separately**

Four interactions, four assertions, using `page.emulateMedia({ reducedMotion: "reduce" })`:

- **Entrance:** below-fold content is at `opacity: 1` on the **first rendered frame** — assert
  before any timeout, or the ordinary delayed reveal finishes and the test passes pre-fix.
- **Scroll indicator:** sample the transform at **three unequal intervals** (e.g. 0/230/570ms).
  A two-point sample can land on equal phases of a loop and read as static.
- **Disclosure:** activate it and assert the panel is at its final height within ~50ms.
- **Dock:** **set a viewport below 1024px first** — `MobileDock` is `lg:hidden`, so at the
  default 1280 it is not rendered and the test is unrunnable. Measure the icon after settling,
  move the pointer to its centre, then poll across the old spring's full response window
  (~400ms) rather than sampling immediately, which would pass before the spring reacts.

A single "reduced motion is on" assertion is not acceptable — §7 requires per-interaction
outcomes, and a blanket check passes even when three of the four still animate.

- [ ] **Step 5: Prove every assertion fails pre-fix**

`git stash` the component changes, run the contract, and confirm each test fails for its own
reason. Restore. **Any assertion that passes against the old code is not testing anything** —
this has been the decisive defect in three consecutive phases.

---

### Task 4: Repair the screenshot harness, then regenerate

**Files:** modify `tests/visual/helpers.ts`, `tests/visual/tokens.spec.ts`

- [ ] **Step 1: Add `revealAll()`**

```ts
/**
 * Trigger every scroll-linked reveal, then return to the top.
 *
 * Phase 4 made BlurFade scroll-triggered. The suite captures fullPage, and
 * lockMotion() sets `transform: none` but does NOT touch opacity - so without
 * this, every below-fold element screenshots at opacity 0 and the baseline bakes
 * in invisible content. `useInView` is { once: true }, so one pass is permanent.
 */
export async function revealAll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // Use the max of both scroll heights: fixed-position rails do not
    // contribute to body.scrollHeight, and a short bound leaves the tail of the
    // document unrevealed.
    const height = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
    );
    const step = Math.floor(window.innerHeight * 0.8);
    for (let y = 0; y <= height; y += step) {
      window.scrollTo(0, Math.min(y, height));
      // Yield across two animation frames so IntersectionObserver delivers
      // rather than coalescing; a bare setTimeout is not a contract.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, height);
    await new Promise((r) => setTimeout(r, 150));
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
}
```

- [ ] **Step 2: Call it in `tokens.spec.ts` before `settle()`** — order matters: reveal, then let the entrance animations finish, then freeze.

- [ ] **Step 3: Verify no element is left transparent**

Before regenerating, assert the harness actually worked:

```ts
test("revealAll leaves nothing transparent", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await revealAll(page);
  await settle(page);
  const hidden = await page.evaluate(() =>
    Array.from(document.querySelectorAll("main .motion-reveal"))
      .filter((el) => Number(getComputedStyle(el).opacity) < 0.9).length,
  );
  expect(hidden, "revealAll did not reveal everything").toBe(0);
});
```

Without this, a silently-broken `revealAll` produces a baseline of blank sections that all
future runs then match.

- [ ] **Step 4: Gate all contracts, then regenerate**

```bash
npx playwright test motion-contract.spec.ts type-contract.spec.ts contrast-contract.spec.ts \
  source-contract.spec.ts token-contract.spec.ts ia-order.spec.ts evidence-schema.spec.ts
# only once green:
npx playwright test --update-snapshots
npx playwright test --repeat-each=3
```

**Inspect all six diffs.** Expect a ~6px downward shift on revealed elements — that is defect 2
being fixed and is the *point* of the phase. Anything else is suspect.

- [ ] **Step 5: `bash scripts/verify.sh`** exits 0. Then **one commit** for Tasks 1–4.

---

### Task 5: Verify by using it

Verification only. **No commit.**

- [ ] **Step 1:** `npx playwright test --repeat-each=3` green.
- [ ] **Step 2: Drive a real browser, normal motion.** Load the live-equivalent build, scroll
slowly, and confirm: sections reveal as they enter view rather than all at once on load; nothing
flashes blurred; revealed elements sit flush, not 6px high; the disclosure expands smoothly; the
dock magnifies on hover.
- [ ] **Step 3: Repeat with reduced motion forced.** Confirm all four outcomes: content is
present immediately without scrolling, the scroll arrow is static, the disclosure snaps open,
and the dock does not magnify.
- [ ] **Step 4:** `git status --porcelain` clean.

---

## Self-Review

**1. Spec coverage.** §7's three named defects (Task 1 steps 2–3), `BlurFadeText` deleted
(step 1), reduced motion specified per interaction across all four (Task 2, asserted per
interaction in Task 3 step 4), §7's "transform and opacity only" asserted by a source audit
(Task 3 step 2), and §7's "narrative moments only, never uniform decoration" delivered by
**Task 2b** — which the first draft of this plan omitted while claiming full coverage.

**The one documented exception.** §7's Rules say "animate `transform` and `opacity` only", yet
its own reduced-motion paragraph requires "disclosure height animation becomes instant" — which
presupposes a height animation exists. Those two sentences cannot both be satisfied literally.
This plan resolves it explicitly rather than silently: **the disclosure keeps its `height`
animation**, because §7 names it, and because the motion-performance skill's rule 2 permits
layout animation on a small, isolated, one-shot, user-initiated surface. It is the only
permitted layout animation in the codebase, and Task 3 step 2's audit is scoped to filters and
masks so it does not contradict this. Converting the disclosure to a transform-based reveal
would change the interaction and is out of scope.

**2. Placeholder scan.** No TBD. The one deliberately loose instruction — resolving real paths
in Task 3 step 2 — is flagged as needing correction rather than left to be discovered.

**3. Consistency.** `revealAll()` is defined in Task 4 step 1 and used in Task 2b step 3, Task 3
steps 1/4 and Task 4 step 3. The `motion-reveal` class is introduced in Task 1 step 4, which is
also where the CSS rule that depends on it lives.

**4. Corrections applied after Oracle review** (verdict `FIX-FIRST`; every finding verified
against the installed Motion source and the real components before fixing):

| Finding | Fix |
|---|---|
| Gating `initial` on `useReducedMotion()` renders the **server HTML hidden** — the hook returns `null` on the server but `true` immediately on a reduced-motion client. React mismatch plus a visible flash, so "instant, never hidden" fails precisely where it matters | Reduced motion is now **CSS-first**: a `prefers-reduced-motion` rule forces `opacity: 1 / transform: none` on `.motion-reveal`, which applies before any JS. React props are identical on server and client; the hook only zeroes the transition duration |
| The scroll-trigger test **passes against the unfixed component** — contact's reveal budget is 1.44s delay + 0.44s = **1.88s**, so sampling at 1500ms catches the old load animation mid-flight and the later scroll lets it finish | Waits **2600ms** past the full old budget before asserting hidden, polls for the reveal after scrolling, and is paired with a source contract that `inView = true` |
| §7's second Rules sentence was **not implemented** while the self-review claimed full coverage: 92 reveal wrappers, including one per skill chip and per social link | New **Task 2b** removes per-item decoration, keeps section and featured-project moments, and asserts a ceiling of 20 wrappers |
| "Bypass `useSpring`" invites a conditional hook call | Concrete shape given: both hooks called unconditionally, switched at `style={{ width: shouldReduce ? DEFAULT_SIZE : width }}` — a plain number is valid Motion style input |
| The dock reduced-motion test is unrunnable at the default viewport (`MobileDock` is `lg:hidden`) | Test sets a viewport below 1024px and polls across the spring's full ~400ms response window |
| `inViewMargin` default `"-50px"` shrinks **all four** root edges, so an element inside the first 50px can never intersect | Changed to bottom-only `"0px 0px -50px 0px"`, and the prop is typed rather than cast |
| The identity test would pass trivially if `lockMotion()` ran first (it injects `transform: none !important`) | Stated explicitly that neither `lockMotion()` nor `freezeVisuals()` may precede it |
| `revealAll()` relied on a bare 120ms timeout and `body.scrollHeight` | Uses `max(documentElement, body)` scroll height, visits the clamped bottom, and yields across two animation frames so the observer delivers rather than coalescing |
| The filter source contract checked four hardcoded files and one spelling | Globs every motion-bearing component and covers `filter`, `backdropFilter`, `WebkitFilter`, `maskImage`, `clipPath`, while distinguishing static `.glass` styling from animation |
| Several reduced-motion assertions could pass pre-fix | Entrance asserts the first rendered frame; the loop is sampled at three unequal intervals; the dock polls across the spring window |
| Claimed `useReducedMotion()` tracks the query reactively | It does not — 13.1.1 is `useState(prefersReducedMotion.current)` with **no setter**. Claim removed |
| Destructuring an unused `blur` would fail lint | Keep it in the interface as `@deprecated`; do not destructure |

**5. Known risks.** (a) `inView = true` changes behaviour at ~30 call sites from one default, so
the screenshot harness must be repaired in the same commit — Task 4 is not deferrable. (b) Task
2b materially changes the site's feel: chips and links stop staging in individually. That is what
§7 asks for, but it is the most likely thing to warrant a second opinion after seeing it. (c) A
~6px shift across 92 elements plus the removal of ~75 reveal wrappers will dominate the diffs,
so "expect a downward shift and fewer staged items; anything else is suspect" is the review
instruction, not a glance.
