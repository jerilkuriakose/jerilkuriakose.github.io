# Phase 5 — Photography + glass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce two photo-backed regions with correct glass and measured per-image contrast, per spec §6 and §15 Phase 5. **This is the last phase.**

**Tech Stack:** Next.js 16.3.3 (`output: 'export'`, `images.unoptimized: true` — both verified in `next.config.mjs`), React 19.2.8, Tailwind 4.3.3, `@playwright/test` 1.62.1. Pillow 11.3.0 with WebP support is present; `magick`/`convert`/`cwebp` are absent.

**Depends on** Phase 6, merged at `8e185ce`.

---

## ⚠️ SHIPPING ORDER — read before anything else

Spec §2: *"**Before the implementation plan is finalised**, Jeril must approve: 1. one first-viewport prototype rendered with a representative final-quality image, and 2. one representative content section. Placeholder-only approval does not satisfy this gate."*

**G2 is unchecked and blocking.** So the order is:

1. Implement and verify **locally**.
2. Present the prototype — first viewport with the real image, plus one representative content section.
3. **Wait for the owner's answer.** Record it by ticking `G2` in the spec.
4. Only then commit, push, deploy.

Do **not** infer gate state from prose. `G4` is likewise still unchecked in the spec even though the owner has approved the generated assets — tick it in Task 1 as part of this work.

## Assets — verified, and what the measurements actually say

Owner-approved AI-generated set (Codex `image_gen.imagegen`), independently verified: 8 candidates in `/tmp/opencode/phase5-assets/`, all landscape, **0.0% warm pixels**, 98.9–100% cool.

Finalists: **`02-ink`** (hero, 1774×887) and **`07-glass-alt`** (contact, 1536×1024).

**Name the metric.** An earlier draft said "mean L 0.16" without defining it — that was mean *gamma-encoded* weighted RGB, which is neither WCAG relative luminance nor OKLab L. Measured properly:

| Image | Mean encoded RGB | **WCAG relative luminance** | Mean OKLab L |
|---|---:|---:|---:|
| `02-ink` | 0.142 | **0.0337** | 0.282 |
| `07-glass-alt` | 0.644 | **0.410** | 0.726 |

**And the "empty left two-thirds" claim was wrong.** Measured by vertical third on `02-ink` (WCAG relative luminance):

| Third | mean | p95 | max | std |
|---|---:|---:|---:|---:|
| 1 (left) | 0.0177 | 0.0486 | 0.0759 | 0.0140 |
| 2 (middle) | 0.0456 | 0.1332 | 0.3457 | 0.0392 |
| 3 (right) | 0.0376 | 0.1476 | 0.5352 | 0.0528 |

Only the **first** third is genuinely calm; the plume enters the middle third. That does not break the design — but it means whole-image means are **not** contrast evidence, and the crop must be chosen from these spatial statistics rather than from an impression.

## The §6 rule conflict, and its resolution

§6 requires the hero be photo-backed, forbids photography behind the metric row, and lists the metric row among sections with no photography. The metric row is inside the hero.

**Resolution: the photograph lives inside the RIGHT GRID CELL only** — `hero.tsx:158`, behind the portrait stack — not in the full-section `absolute inset-0` container.

This distinction is load-bearing, not stylistic. At mobile the grid collapses to one column and **the portrait is ordered first**: text is `order-2 lg:order-1` (`hero.tsx:37`), portrait is `order-1 lg:order-2` (`hero.tsx:158`). A section-level "right-side" background is therefore *not* right-bounded at mobile — it would sit over the proof row. Confining the photo to the cell keeps it in the portrait row at every breakpoint.

| §6 rule | How it is satisfied |
|---|---|
| 1 — at most two photo regions | hero cell + contact band |
| 2 — nothing behind the metric row | photo is inside the portrait cell; metric row is in the other cell at every breakpoint |
| 3 — first viewport legible with blur disabled | all first-viewport text sits on solid canvas and depends on no filter |
| 4 — one photo region visible at a time | hero and contact are at opposite ends; proven by scroll-interval arithmetic, not sampling |
| 5 — bounded scrim on text-over-photo | the only text over the photo is the "Open to work" badge, which already has an opaque background |

## The glass polarity is currently backwards, and the Dock double-declares blur

Two existing defects this phase must fix:

1. `.glass` puts a translucent 80% fill in the **base** rule with an unconditional `backdrop-filter`. §6 explicitly calls this out: without blur support an 80% fill lets busy photography through sharply and contrast fails. Base must be near-opaque; the gradient belongs inside `@supports`.
2. `Dock` (`dock.tsx:27`) carries its **own** `backdrop-blur-md` and `supports-backdrop-blur:*` utilities, independent of `.glass` — which is applied to the same element by `mobile-dock.tsx:26`. That is two blur declarations on one element, it muddies §6 hard rule 1, and mutating `.glass` would not remove the Tailwind one.

Note the blurred element itself computes as `static`; its `<nav>` ancestor is `fixed`. So a literal "only fixed/sticky elements" assertion fails on a technicality. The mobile dock is **fixed chrome**, not a "glass card in a photo band" — document it as the one sanctioned exception.

---

### Task 1: Asset pipeline

**Files:** create `public/media/*`, `data/media.ts`; modify the spec (tick `G4`)

- [ ] **Step 1: Move only the two finalists in.** The six unused candidates are ~13MB of dead weight — leave them in `/tmp` and record in the manifest that they exist and why they were rejected.

- [ ] **Step 2: Variants at source-capped widths — never upscale**

`02-ink` is **1774** wide and `07-glass-alt` is **1536**. A 1920 variant would upscale them by 8% and 25%, which contradicts this plan's own performance gate. So:

| Image | Widths |
|---|---|
| `02-ink` (hero) | 640 / 1280 / **1774** |
| `07-glass-alt` (contact) | 640 / 1280 / **1536** |

WebP plus a JPEG fallback at the same widths, via Pillow. Every `srcSet` width descriptor must equal the file's **actual** width — assert each from its header, not from the resize call.

- [ ] **Step 3: `data/media.ts` — the auditable manifest**

Per image: id, variants with real dimensions, the **named** metrics (WCAG relative luminance and mean OKLab L, not an undefined "mean L"), per-third spatial statistics, focal/crop bounds, chosen scrim strength, and provenance.

**Provenance is not the licensing check.** §6 requires a licensing check; "AI-generated via Codex" records origin only. Record the applicable usage right / service terms reference and the generation date alongside it, so the check is auditable later. This does not reopen the approved AI-asset decision.

- [ ] **Step 4: Tick `G4` in the spec** — the owner supplied and approved the set. Gate state lives in the spec's checkboxes, never in prose.

- [ ] **Step 5: Gate** — build clean; assert every variant the manifest references exists with the declared dimensions.

---

### Task 2: Glass tokens and correct polarity

**Files:** modify `app/globals.css`, `components/magicui/dock.tsx`

- [ ] **Step 1: Five tokens per theme** — `--glass-solid`, `--glass-translucent`, `--glass-rim`, `--glass-shadow`, `--scrim`. Separate light and dark values; §6: *"a white-based fill washes out on dark."* Derive from the Phase 2 ramp and **measure**, never compute.

- [ ] **Step 2: Invert `.glass`** — near-opaque base (92–96%); the translucent gradient and **both** `-webkit-backdrop-filter` and `backdrop-filter` inside `@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))`.

- [ ] **Step 3: Remove Dock's duplicate blur.** Delete `backdrop-blur-md` and the `supports-backdrop-blur:*` utilities from `dock.tsx:27` so `.glass` is the single authoritative declaration for that surface.

- [ ] **Step 4: Add bounded `.scrim`** — covers the photo region only, never a whole section.

- [ ] **Step 5: Prove the polarity by parsing the CSS, not by faking support**

Chromium **cannot** be made to treat a supported property as unsupported: setting `backdrop-filter: none` still leaves `@supports` matching, so the translucent enhancement stays active. An emulation-based test would silently prove nothing.

Instead, assert structurally via CSSOM: a base `.glass` rule **outside** any `CSSSupportsRule` uses `--glass-solid`, and a rule **inside** a `CSSSupportsRule` uses `--glass-translucent` plus both filter properties. Then, for the *rendered* fallback, explicitly neutralise the enhancement rule and force the base, and measure the composite.

---

### Task 3: The hero region

**Files:** modify `components/sections/hero.tsx`, `tests/visual/ia-order.spec.ts`

- [ ] **Step 1: Remove the two decorative blur blobs.** Verified safe: no contrast assertion depends on them and overflow stays 0 — the zero-overflow *assertion* is the invariant, not that particular container. The full-section container can go with them.

- [ ] **Step 2: Insert the photo inside the right grid cell** (`hero.tsx:158`). Make that cell `relative isolate`; put the picture in an absolutely-positioned, **independently clipped** wrapper behind the `BlurFade` portrait stack. Do **not** clip the cell itself, and do not clip the rings or the "Open to work" badge at `hero.tsx:161–187` — they intentionally overflow the portrait.

- [ ] **Step 3: Crop from the spatial statistics.** The plume is in thirds 2–3, so favour those in the cell crop; that is what makes the photo read as texture rather than as an empty dark rectangle.

- [ ] **Step 4: `<img>` with explicit `width`/`height`, hand-written `srcSet`/`sizes`, `loading="eager"`, `fetchPriority="high"`, `decoding="async"`.** It is the LCP element. `images.unoptimized: true` means Next contributes nothing — a missed `srcSet` silently ships the full-size file.

- [ ] **Step 5: Update `ia-order.spec.ts:51`.** It asserts `main img` count is exactly **1** — written in Phase 1a to prove the About photo was deleted, and it will fail the moment a hero photo exists. Replace the count with **semantic** assertions: exactly one portrait in the hero, and exactly one `[data-photo]` image in the hero cell. Do not simply bump the number; that would discard the original guarantee.

---

### Task 4: The contact region

**Files:** modify `components/sections/contact.tsx`

- [ ] **Step 1: Bounded band** behind the contact block. `07-glass-alt` has WCAG luminance 0.410 — light — so the existing dark ink text needs only a light scrim.
- [ ] **Step 2: `loading="lazy"`** — far below the fold, the opposite of the hero.
- [ ] **Step 3: Glass on the CTA cluster only if it actually overlaps the photo**, per §6: *"Glass cards appear only where they overlap a photography band."* If it does not overlap, do not add glass.

---

### Task 5: The photo contract

**Files:** create `tests/visual/photo-contract.spec.ts`; modify `tests/visual/source-contract.spec.ts`

- [ ] **Step 1: Measure contrast on the real composite — correctly**

§6: contrast measured per image **on the final composite, after `saturate()`**.

Four traps to avoid, each of which would let illegible text pass:

- **Do not call `freezeVisuals()`.** `helpers.ts:50` injects `* { filter: none !important; }`, which strips the `saturate()` §6 requires measuring *after*.
- **Do not sample "under a text run" naively** — you will hit glyph pixels or whitespace. Record each text node's `Range.getClientRects()`, then make the text **transparent while preserving layout**, capture the region, and sample the backdrop.
- Capture with CSS-pixel scaling and decode in-browser via `createImageBitmap` + canvas.
- Check the **worst** sampled pixel against the used text colour, not the mean. A mean passes while a headline crosses the plume.

- [ ] **Step 2: Assert the five outcome rules, without the vacuous paths**

- **at most two photo regions** — and require every photo source to come through the manifest and carry `data-photo`, so an unmarked CSS `background-image` or bare `<img>` cannot escape the count.
- **nothing behind the metric row / Skills / Publications / Education + Awards** — compare **rendered rectangles** for overlap. DOM ancestry does not prove a *sibling* photo isn't geometrically behind the metric row.
- **one photo region visible at a time** — prove it by computing each region's scroll-visibility **interval** and asserting the intervals are disjoint. Sampling a few scroll positions cannot prove "at any scroll position".
- **first viewport legible with blur disabled** — via the forced-base-rule path from Task 2 Step 5.

- [ ] **Step 3: Assert the six hard rules, without the vacuous paths**

- **one `backdrop-filter` per stack, never nested** — walk ancestor chains using **computed styles**, not source text.
- **no blur on a scrolling container** — the blurred element may compute `static` while a `fixed` ancestor is the real chrome, so accept "contained by a fixed/sticky ancestor" and assert the mobile dock is that documented exception.
- **nothing animates filter/backdrop-filter/mask/blur** — extend Phase 4's source audit; note it currently scans motion-bearing TSX only, so widen it to CSS transitions, keyframes and pseudo-elements.
- **both `-webkit-` and standard present** — assert they are in the **same** rule, since a source-presence check finds them in unrelated rules.
- **`@supports` fallback near-opaque** — token correctness is not enough; a Tailwind utility or cascade order can override the rendered surface, so assert the **rendered** result too.

- [ ] **Step 4: Performance** — total bytes of the hero-critical variants under a stated budget; no variant exceeds its declared intrinsic size.

- [ ] **Step 5: Update `source-contract.spec.ts`.** New glass gradients and `color-mix` sites will invalidate its exact pinned counts (`:40–83`). Update around **named invariants** rather than just raising totals — a raised total is not a contract.

- [ ] **Step 6: Mutation-test every category.** Remove the scrim; make the base glass translucent; nest a second `backdrop-filter`; put a photo behind the metric row; delete the `@supports` block; leave only `-webkit-`; add an unmarked `<img>`; upscale a variant. Confirm the matching assertion fails for each. **Six phases running, the decisive defect has been a gate that proved nothing** — a category without a mutation test is not trusted.

---

### Task 6: Verify, present, THEN ship

- [ ] **Step 1:** Gate every contract, inspect all six diffs, regenerate the baseline, `verify.sh` exits 0.
- [ ] **Step 2: Look at it in a real browser** — both themes, 375 and 1280, and with the base glass forced. Confirm the hero reads as intentional and the metric row is unambiguously on canvas at **both** breakpoints, given the mobile reordering.
- [ ] **Step 3: PRESENT THE PROTOTYPE AND STOP.** Produce the two artefacts §2 demands — the first viewport with the real image, and one representative content section — and hand them to the owner. **Do not commit, push or deploy yet.**
- [ ] **Step 4: On approval, tick `G2` in the spec.** Then commit, push, confirm the deploy, and verify the variants are served with correct content types.
- [ ] **Step 5:** `git status --porcelain` clean.

---

## Self-Review

**1. Spec coverage.** §6's five outcome rules and six hard rules each map to a numbered assertion in Task 5, with the specific vacuous path named for each. §15's manifest and responsive variants are Task 1. The two-region limit holds exactly.

**2. Corrections applied after Oracle review** (verdict `FIX-FIRST`; every finding verified against the real code and the real images before fixing):

| Finding | Fix |
|---|---|
| The plan **deployed before** the blocking G2 gate, which §2 requires *before finalisation* | Task 6 now implements, presents, waits, ticks `G2`, and only then ships. `G4` is ticked in Task 1 |
| The insertion point was underspecified, and at mobile the portrait is ordered **first** (`order-1 lg:order-2`) — so a section-level "right-bounded" photo would reach the proof row | Photo goes inside the right **grid cell**, independently clipped, at every breakpoint |
| `backdrop-filter: none` **cannot** fake unsupported: `@supports` still matches, so the enhancement stays active and the test proves nothing | Structural CSSOM proof plus an explicitly forced base rule for the rendered check |
| 1920px variants would **upscale** both sources (1774 and 1536 wide) | Source-capped widths: 640/1280/1774 and 640/1280/1536 |
| `Dock` carries its own `backdrop-blur-md` **and** `.glass` — two declarations on one element | Dock's duplicates removed so `.glass` is authoritative; the dock documented as the sanctioned fixed-chrome exception |
| `ia-order.spec.ts:51` hard-codes `main img` count `= 1` and will fail | Replaced with semantic portrait/photo assertions rather than a bumped number |
| `freezeVisuals()` strips `filter`, invalidating "measure after `saturate()`" | Explicitly excluded from the composite measurement |
| Seven ways the assertions could pass while §6 was broken | Each named and closed in Task 5 Steps 2–3 |
| Provenance ≠ licensing check | Usage-right/terms reference added to the manifest |
| "mean L" undefined, and "empty left two-thirds" overstated | Metrics named (WCAG luminance / OKLab L) with per-third statistics; only the first third is calm, and crops now come from those numbers |

**3. Known risks.** (a) `images.unoptimized: true` means no framework help; a missed `srcSet` silently ships a full-size LCP image. (b) Contrast over a photograph varies per pixel — the worst-pixel composite check is the only trustworthy measure. (c) The mobile reordering is the subtlest constraint here: a change to the hero grid could reintroduce photography behind the metric row, which is why Task 5 Step 2 compares rendered rectangles rather than DOM ancestry.
