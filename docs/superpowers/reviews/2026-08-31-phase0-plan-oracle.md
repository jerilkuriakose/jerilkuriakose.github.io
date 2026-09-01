# Oracle review — Phase 0 implementation plan

**Reviewed:** `docs/superpowers/plans/2026-08-31-phase0-oklch-token-conversion.md`
**Reviewer:** Oracle (read-only consultation agent)
**Date:** 2026-08-31
**Verdict:** `SAFE AFTER FIXES`
**Disposition:** all 6 blockers and 6 should-fixes applied. Review is **closed**.

---

## What Oracle got right (fixed)

1. **Step-ordering defect.** Task 3 asserted zero `hsl(` *before* the step that converted
   the last literal, making the expected result impossible. → Resolved by not converting
   that literal at all (see overrides) and asserting zero `hsl(var(` instead.
2. **Baseline captured from the working tree.** Could bless unrelated uncommitted work,
   and the revert step (`git checkout -- app/globals.css`) could destroy it — while the
   spec requires a worktree. → Task 2 now creates a disposable `mktemp` worktree pinned to
   the harness commit, does the mutate/revert cycle there, copies only snapshots back, and
   requires a clean `status --short` before removal without `--force`.
3. **Server config could silently test stale output.** `npx --yes serve` downloads an
   unpinned package, and `reuseExistingServer: true` accepts any process already answering
   on the port. → `python3 -m http.server` (the workspace's established command) with
   `reuseExistingServer: false`.
4. **Task 4's verification could not work.** Playwright tears down its managed `webServer`
   on exit, so a subsequent standalone Node script hits a dead server. Also
   `getComputedStyle()` preserves `oklch()` rather than serialising to `rgb()`, so the
   expected string was not a valid assertion. → Verification moved inside a Playwright test
   using a 1×1 canvas to read the *used* 8-bit value.
5. **The screenshot budget did not prove the claimed equivalence.**
   `maxDiffPixelRatio: 0.001` on a 1280×9000 page permits ~11,500 changed pixels, and
   `threshold: 0.15` discards modest per-pixel differences before counting. Six full-page
   screenshots also never exercise focus, hover, selection, or unused tokens. → Three
   layers now: per-token 8-bit canvas assertions (46 values, both themes), a static source
   contract (all 16 alpha multiplicities + the preserved literal + `--accent-tint`), and
   screenshots at literal `maxDiffPixels: 0` / `threshold: 0`, labelled broad coverage
   rather than proof.
6. **`git add -A` in a verification-only task** could stage unrelated files and expanded
   Phase 0's scope. → Task 4 now makes no commit.

Should-fixes applied: `addInitScript` before first navigation (`next-themes@0.4.6`
`storageKey` default confirmed `"theme"`); `--repeat-each=3` for stability; atomicity
rationale corrected to acknowledge the dual-token alternative and say why it is not used;
`npm ci` added to gates; `--accent-tint` documented as having no consumer; the
"every step is 2–5 minutes" claim dropped as untrue.

## What Oracle got right that was counter-intuitive (accepted, no change)

`color-mix(in oklab, X p%, transparent)` **is** exactly equivalent to setting alpha `p`.
Oracle supplied the proof: premultiplied interpolation gives premultiplied `p×C` and alpha
`p`; unpremultiplying divides by `p`, restoring `C`. It also has a safer support floor than
relative colour syntax (`color-mix()` + absolute `oklch()` interoperable since May 2023 vs
~Chrome 125 / Firefox 128 / Safari 18). This was the finding most expected to be wrong and
was correct. The proof is recorded in the plan so a future reader does not "fix" it.

## ⚠️ Two Oracle claims OVERRIDDEN by measurement — do not revert

Oracle asserted: *"No 4-decimal table value changes its nearest 8-bit sRGB hex under
standard round-trip conversion and clipping."* **Measured in Chromium 141 via 1×1 canvas
sampling, two of sixteen do:**

| Value | Source pixel | 4dp | 6dp |
|---|---|---|---|
| `hsl(166 76% 47%)` (`--primary`) | `[29,211,168]` | `[28,211,168]` ✗ | `[29,211,168]` ✓ |
| `hsl(166 100% 50%)` (gradient stop) | `[0,255,195]` | `[0,255,196]` ✗ | `[0,255,196]` ✗ |

**Override 1 — precision.** L and C to **6 decimals**, hue to 4. Not 4dp.

**Override 2 — the gradient literal.** `app/globals.css:203` `hsl(166 100% 50%)` sits on
the sRGB gamut boundary (R=0) and cannot round-trip at *any* precision. Oracle proposed
converting it and asserting zero `hsl(`. It is instead **left unconverted**, and a
source-contract test asserts it stays. Phase 2's palette retune replaces that gradient
anyway.

Achromatic values were separately confirmed safe at 4dp: `oklch(1 0 0)` → `[255,255,255]`
and `oklch(0.9848 0 0)` → `[250,250,250]`, both matching source exactly.

## Self-inflicted defect caught before this review

An earlier draft of the plan carried a **guessed** value for the gradient stop —
`oklch(0.8100 0.1620 168.50)` — wrong by 0.078 in lightness. Caught by the plan's own
self-review, which had flagged it as the one unverified number. The plan now states that
every OKLCH figure is computed with a hex roundtrip and must not be hand-edited.
