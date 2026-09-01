# Oracle review — redesign design spec

**Reviewed:** `docs/superpowers/specs/2026-08-31-portfolio-redesign-design.md`
**Reviewer:** Oracle (read-only consultation agent)
**Date:** 2026-08-31
**Verdict:** `SAFE AFTER FIXES` — "safe to turn into an implementation plan only after the blockers are fixed"
**Disposition:** all 8 blockers fixed in the spec. Review is **closed**.

Reviewed adversarially on the explicit premise that most design decisions were
agent-made after the owner said *"I don't understand any of these, do whichever is the
best"* — i.e. unvetted by a design-informed human.

---

## Claims independently verified before acting (4/4 confirmed TRUE)

| Oracle claim | Verification | Result |
|---|---|---|
| `oklch(0.50 0.098 171)` is outside sRGB (linear red ≈ −0.000074) | recomputed OKLCH→linear sRGB | **TRUE.** Original in-gamut check used `eps=1e-4`, which masked it. Oracle's boundary `C = 0.097938` matched to 6 decimals |
| `BlurFade` visible state ends at `y: -yOffset`, not `0` | read `components/magicui/blur-fade.tsx:37` | **TRUE.** Every wrapped element settles 6px above its natural position |
| OG metadata declares 800×800 but `profile.jpg` is 996×1325 | read `app/layout.tsx:57-58` + PIL | **TRUE** |
| Spec prose contradicted its own decision table on attribution | read spec §2 | **TRUE** |

The `BlurFade` finding retroactively explained an observation that had been recorded and
misread earlier in the session: browser measurement showed `matrix(1,0,0,1,0,-6)` on
settled elements, which was interpreted as "settled" rather than "settled in the wrong
place."

## Blockers (all fixed)

1. **IA could not meet its success criterion with content out of scope.** Hero + impact
   strip would render the same scarce numbers twice. → Metrics now attach to `work` /
   `projects` records with stable IDs; hero resolves featured IDs; separate impact strip
   removed; content-approval prerequisite added as a blocking gate.
2. **"About" had two contradictory destinations** (hero "absorbs About" vs. §6 "folded
   into Experience's intro"). → Split explicitly: positioning summary in hero, leadership
   context opens Experience, neither named "About".
3. **Four photography bands were locked before the images existed.** → Replaced with
   outcome constraints (max two photo regions to start, none behind dense content, first
   viewport legible with blur disabled, one photo region visible at a time) plus a
   real-image prototype gate. Phase 5 not shippable on placeholders.
4. **Colour roles incomplete and one gamut claim false.** A 1.80:1 colour cannot be
   authorised for borders (WCAG 1.4.11 needs 3:1). → Full semantic token graph
   (`brand-vivid`, `interactive`, `display-accent`, `on-brand`, `ink`/`ink-muted`,
   `border-subtle`, `focus`, `destructive`) each with a measured floor; gamut corrected to
   `C ≤ 0.0979`; the phantom third teal at "30–34% lightness" removed.
5. **The glass fallback was not a legible fallback.** A 20–46% white gradient was
   described as "opaque" — without `backdrop-filter`, photography shows straight through.
   → Polarity inverted: near-opaque theme-specific surface by default, translucent
   gradient + blur only inside `@supports`. Separate light/dark glass tokens added.
   Nesting rule kept but its rationale corrected (backdrop roots *bound* nested filters;
   the exponential-cost description is of the model they prevent).
6. **Motion rules contradicted the retained component.** Spec said "never animate filter"
   while retaining `BlurFade`, which animates exactly that. → Both bugs plus the `inView`
   default now specified; `BlurFadeText` to be deleted; reduced motion specified
   per-interaction rather than as a bare media query.
7. **Accessibility and performance cannot be a final phase.** Also: Core Web Vitals are
   field metrics at p75 and are not lab-confirmable. → A11y/responsive/lab-perf made
   cross-cutting gates for every phase; lab gates separated from post-deploy field
   objectives.
8. **Old-vs-new pixel diffing is invalid past the mechanical phase.** → Scoped to Phase 0
   only; later phases diff against the approved previous-phase snapshot.

## Should-fix (applied)

Phase 0 kept but reframed as a checkpoint with a realistic tolerance; IA moved ahead of
cosmetics; targeted browser acceptance coverage instead of blanket unit tests; branded
1200×630 OG image; responsive image delivery specified (format alone is insufficient under
`images.unoptimized`); typography judged on hierarchy/scan-speed rather than "PhD
signalling", with a unique `next/font` provider variable; decision attribution corrected
and an owner sign-off gate added.

## Accepted as out of scope

Arabic/RTL localisation made an explicit non-goal (English-language audience; unaudited
machine translation would be worse than none) with logical CSS properties required so it
is not blocked later. Print styles, contact form and error states scoped out. Analytics
optional, post-launch, non-gating.

## Steelman offered

An "evidence-first editorial dossier" — mostly solid off-white surfaces, glass as accent
rather than page identity. Largely consistent with the composition the owner already
chose; recorded in case the direction is revisited.
