# Oracle review — Phase 3 type system plan

**Date:** 2026-09-01
**Artifact:** `plans/2026-09-01-phase3-type-system.md`
**Verdict:** `FIX-FIRST` — 2 blockers, 4 should-fix. **All verified true against the tree at `c446c38`; nothing overridden. All fixed.**

---

## Findings, and how each was verified

| # | Finding | Verification | Verdict |
|---|---|---|---|
| B1 | The new test snippet used `test`/`expect` without importing them | Read the plan — no `import { test, expect }` anywhere in it | **TRUE** |
| B2 | Heading coverage wrong and incomplete | `grep -rnE '<h[1-6]'` over `components/`: `selected-work.tsx:43` is an **`h4`**, not the `h3` the plan claimed; `featured-project.tsx:51` (`h3`, `text-xl md:text-2xl`) was never named; six further headings uncovered (`contact.tsx:18`, `selected-work.tsx:29`, `education-awards.tsx:28`/`:70`/`:36`/`:77`, `publications.tsx:21`). A `text-4xl…7xl` grep cannot see `text-lg`/`text-xl`/`text-2xl` | **TRUE** |
| SF1 | `ratioMax` is an upper bound only, so a wrong-but-smaller line-height passes; and the synthetic probe cannot see utility overrides on real elements | `publications.tsx:21` carries `leading-tight` and `hero.tsx:41` carries `tracking-tight`. Tailwind 4.3.3 declares `@layer theme, base, components, utilities`, so utilities beat the component layer — both would silently win | **TRUE** |
| SF2 | `.numbered-heading::before` sets a fluid `font-size` with no line-height | `globals.css`: the element has `font-size: clamp(1.5rem, 5vw, 2rem)` and the counter `font-size: clamp(1rem, 3vw, 1.25rem)`, **neither with a line-height** | **TRUE** |
| SF3 | The provider-variable test is vacuous | `layout.tsx:91` puts `inter.variable`/`jetbrainsMono.variable` on **`<body>`**, not `<html>`. So `getComputedStyle(documentElement).getPropertyValue("--font-display")` resolves `var(--font-newsreader)` to nothing and falls through to Georgia — while `/Newsreader/` still matches the literal variable *name* in the unresolved value. **The test would pass with the font broken** | **TRUE** |
| SF4 | `grep -c 'font-size'` cannot prove a line-height sits beside it | Self-evident: it prints a count | **TRUE** |

## What Oracle independently confirmed

Four claims I had asserted, checked against installed sources rather than taken on trust:

- **`axes: ["opsz"]` is valid.** Next 16.3.3 declares `axes?: "opsz"[]` for `Newsreader`; its metadata gives `opsz` 6–72 and variable `wght` 200–800, and omitting `weight` defaults to `"variable"` before axes validation — so no build-time throw.
- **The variable-name trap is avoided.** `--font-newsreader` → `--font-display` cannot be self-referential, since Tailwind generates only `--font-sans`/`--font-mono` from `@theme`.
- **`@layer components` is real** in Tailwind 4.3.3 and does lose to utilities, as the plan claims.
- **Every `clamp()` is arithmetically correct** at 375/768/1280 — 38.70/59.14/72.00, 32.50/49.79/60.00, 25.05/33.70/36.00, 20.41/23.36/24.00 — and all written assertions pass. The declared ratios compute to exactly 1.04/1.08/1.18/1.30.

## The pattern worth carrying forward

Three of the six findings are the *same* failure: **a test that cannot fail.** The vacuous
provider probe, the upper-bound-only ratio, and the synthetic-probe-blind-to-utilities all
report green while the thing they check is broken. This is now the third phase where the
decisive defect was a gate that proved nothing — Phase 2 shipped a role-level assertion that
passed while `text-foreground` sat at 1.14:1 on a panel, and a class-list-based contrast check
that walked past a 36px heading at 2.34:1.

**Rule:** every new gate must be run against a deliberately injected version of the defect it
exists to catch, and observed to fail, before it is trusted.
