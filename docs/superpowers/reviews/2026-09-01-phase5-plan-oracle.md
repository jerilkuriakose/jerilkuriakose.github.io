# Oracle review — Phase 5 photography + glass plan

**Date:** 2026-09-01
**Artifact:** `plans/2026-09-01-phase5-photography-glass.md`
**Verdict:** `FIX-FIRST` — 4 blockers, 4 should-fix, 1 nit. **All verified; nothing overridden. All fixed.**

Oracle **accepted** the core design decision: bounding the hero photograph so the metric row
stays on canvas is a legitimate reading of §6, not a dodge.

---

## The blocker that mattered most: I was going to ship before the gate

Spec §2, verbatim: *"**Before the implementation plan is finalised**, Jeril must approve: 1. one
first-viewport prototype rendered with a representative final-quality image, and 2. one
representative content section. Placeholder-only approval does not satisfy this gate."*

My Task 6 committed, pushed and deployed in Step 3 and only *reported* G2's precondition in Step
5 — exactly backwards for a gate the spec calls blocking. Both `G2` and `G4` are still unchecked
in the spec. Corrected: implement locally, present the two artefacts, wait, tick `G2`, then ship.

## The blocker that would have broken §6 at mobile

I said "bound the photo to the right side". Oracle checked the actual grid:

- text column: `order-2 lg:order-1` (`hero.tsx:37`)
- portrait column: `order-1 lg:order-2` (`hero.tsx:158`)

**At mobile the portrait is ordered FIRST**, and the grid collapses to one column. So a
*section-level* "right-side" background is not right-bounded below `lg` at all — it would sit
behind the proof row, violating §6 rule 2 on exactly the viewport where legibility is tightest.

Fix: the photo goes inside the **right grid cell**, independently clipped, so it stays in the
portrait row at every breakpoint. The cell itself is not clipped — the rings and the "Open to
work" badge (`hero.tsx:161–187`) intentionally overflow it.

## The blocker that would have made a test prove nothing

I proposed emulating "no `backdrop-filter` support" by setting `backdrop-filter: none`. That
does not work: Chromium still **matches** `@supports`, so the translucent enhancement stays
active and the fallback path is never exercised. The test would have passed while the
near-opaque base rule was wrong or absent.

Fix: prove polarity **structurally** via CSSOM — a base rule outside any `CSSSupportsRule` using
`--glass-solid`, an enhancement rule inside one using `--glass-translucent` plus both filter
properties — then force the base rule explicitly for the rendered measurement.

Related, and equally decisive: `freezeVisuals()` (`helpers.ts:50`) injects
`* { filter: none !important; }`. Calling it would strip the very `saturate()` §6 requires
measuring *after*.

## The fourth blocker: my variants would have upscaled

I specified 640/1280/1920. The sources are **1774×887** and **1536×1024**, so 1920 upscales them
by 8% and 25% — contradicting the plan's own performance gate. Now source-capped.

## Should-fix, all verified

| Finding | Verification |
|---|---|
| `Dock` carries its own `backdrop-blur-md` + `supports-backdrop-blur:*` (`dock.tsx:27`) while `.glass` is applied to the same element — two blur declarations, and mutating `.glass` would not remove the Tailwind one | Confirmed in source |
| `ia-order.spec.ts:51` hard-codes `main img` count `= 1` and fails the moment a hero photo exists | Confirmed — I wrote it in Phase 1a to prove the About photo was deleted |
| Seven specific ways the new assertions could pass while §6 was broken — unmarked photo sources escaping a `[data-photo]` count, DOM ancestry not proving *geometric* overlap, scroll sampling not proving "any position", disabling only the standard property, source-presence finding both properties in unrelated rules, a correct token overridden by cascade, and the motion audit missing CSS keyframes | Each accepted and closed |
| Provenance ≠ the licensing check §6 requires | Correct — "AI-generated via Codex" records origin, not usage rights |

## The nit that corrected my own measurement

I wrote "mean L 0.16" without defining the metric — it was mean *gamma-encoded* weighted RGB,
which is neither WCAG relative luminance nor OKLab L. Properly measured:

| Image | Mean encoded RGB | WCAG relative luminance | Mean OKLab L |
|---|---:|---:|---:|
| `02-ink` | 0.142 | 0.0337 | 0.282 |
| `07-glass-alt` | 0.644 | 0.410 | 0.726 |

Oracle's whole-image figure matched my own recomputation exactly, so the *measurement* agreed —
the naming was the defect.

It also caught that my "almost-empty left two-thirds" was overstated. Per-third WCAG luminance
on `02-ink`: **0.0177 / 0.0456 / 0.0376** with p95 **0.0486 / 0.1332 / 0.1476**. Only the first
third is genuinely calm; the plume enters the middle. The design still holds, but crops now come
from those statistics rather than from an impression, and whole-image means are explicitly barred
as contrast evidence.

## Verified technical claims

- `next.config.mjs` does set both `output: "export"` and `images.unoptimized: true`.
- Next 16 has **no** built-in build-time local variant generator under static export; a custom
  loader would need an external runtime service. Committed variants and hand-written `srcSet`
  are genuinely required.
- Pillow 11.3.0 with WebP support is present; `magick`, `convert` and `cwebp` are absent.
- Removing the two blur blobs is functionally safe — the zero-overflow *assertion* is the
  invariant, not the container that produced it.

## Pattern, seventh review running

Every phase in this project has had at least one **gate that proved nothing**, and this review
found seven at once plus a fallback emulation that could not work. The rule stands: mutation-test
every assertion category, and treat a category without one as untrusted.
