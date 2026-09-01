# Oracle review — Phase 1a and Phase 2 plans

**Date:** 2026-09-01
**Artifacts:** `plans/2026-09-01-phase1a-decomposition-ia.md` (Plan A),
`plans/2026-09-01-phase2-palette-retune.md` (Plan B)
**Verdict:** `FIX-FIRST` (Plan A) · `REDESIGN` (Plan B) — all 13 blockers verified true, nothing overridden
**Triage result: all 13 blockers verified TRUE. Nothing overridden.**

Notable, because the three prior Oracle reviews each contained findings that browser
measurement disproved. This one did not. Every measurable claim was re-measured and held.

---

## How each finding was verified

### Plan A — 3 blockers, 4 should-fix, 1 nit

| # | Finding | Verification | Verdict |
|---|---|---|---|
| B1 | Optional `metrics` typing is not executable — omitting a property does not make it optional | `data/resume.tsx:394` ends `} as const;`, so `DATA` is inferred from literals. `e.metrics ?? []` and `resolveFeaturedMetrics(DATA)` would not type-check | **TRUE** |
| B2 | `education-awards.tsx` cannot be a verbatim Server Component | `app/page.tsx:636` has `onClick={(e) => e.stopPropagation()}` on the school anchor. No clickable parent exists, so the handler is dead weight | **TRUE** |
| B3 | Phase omits the per-role evidence container the spec requires | Spec §15 Phase 1a: "**Build the containers**: hero proof row **and per-role evidence**, both rendering nothing when empty". Plan A builds only `HeroProofRow`; `ExperienceCard` never renders `job.metrics` | **TRUE** |
| SF1 | "Extract verbatim" contradicts "combined under one heading" | Both phrases are in Task 3 Steps 2–3. Heading text, grouping and fate of the old headings are all unspecified | **TRUE** |
| SF2 | Screenshot regeneration gate proves only DOM order | `ia-order.spec.ts` asserts sequence only — not that `summary` moved, that the duplicate skill teaser/photo went away, or that metrics honour 0..N | **TRUE** |
| SF3 | Disclosure a11y left manual, known defect preserved | The moved button lacks `aria-expanded`/`aria-controls`; spec §9 includes disclosure state in acceptance. "Manually confirm" is not deterministic for an autonomous executor | **TRUE** |
| SF4 | Featured cardinality unenforced | Contract says two claims max; 3+ `featuredMetricIds` would pass every proposed test | **TRUE** |
| NIT | Client-boundary counts inconsistent ("five things" vs "only four") | Wording drift; `BlurFade`/`Dock`/`ThemeToggle`/Tooltip are client too | **TRUE** |

### Plan B — 10 blockers, 2 should-fix, 1 nit

Measured in Chromium 141 (`oklch` inputs → 1×1 canvas → WCAG relative luminance):

| # | Finding | Measurement / evidence | Verdict |
|---|---|---|---|
| B1 | The `FLOORS` table **cannot pass** — it demands `ink` on `panel` ≥4.5:1 in *both* themes | **1.14:1** in light. Ink `#142922` and panel `#17342D` are both dark. The spec's verified pairing is *canvas-coloured* text on the deep panel (12.61:1), which the plan measured and then failed to encode | **TRUE — fatal** |
| B2 | Light `--focus` cannot satisfy its own two-surface contract | focus `#00755C` on panel = **2.36:1**, below the 3:1 Task 3 Step 3 demands. On canvas it is fine at 5.34:1 | **TRUE** |
| B3 | The rendered-text enforcement test is unsound | `getComputedStyle().color` returns **`oklch(0.26 0.03 171)` verbatim**, not `rgb()`. The test's `s.match(/\d+/g).slice(0,3)` therefore extracts `[0, 26, 0]` — garbage that matches nothing. **The gate would have gone green while the site failed WCAG.** `tests/visual/helpers.ts:74-80` documents this exact trap, and `sample8bit()` at `:85` already solves it | **TRUE — worst kind** |
| B4 | Inventory misses authored CSS that becomes illegal | **20** `var(--primary)` usages in `globals.css`, including `color:` at `:174` (`.numbered-heading::before`), `:260` (`.tech-badge`) and `:388` — none findable by a `text-primary` TSX grep. Plus 3 raw palette utilities (`to-blue-500`, `bg-green-500`, `bg-blue-400`) | **TRUE** |
| B5 | Base-token migration not decision-complete | No measured value for the shared `--secondary`/`--muted`/`--accent-bg` surface; destructive "keep its hue and re-verify" is not executable if it fails | **TRUE** |
| B6 | Repointing `--background` silently disables **both** harnesses | `source-contract.spec.ts:16` and `token-contract.spec.ts:16` are both `const CONVERTED = /--background:\s*oklch\(/.test(CSS)`. `--background: var(--canvas)` fails that regex → source-contract skips its suite, token-contract switches to invalid `hsl(var(--background))` | **TRUE — subtle** |
| B7 | Measurement script cannot find the declarations | Inspects only top-level rules with `.style`; tokens nested under grouping/layer rules need recursion. Moot anyway — `sample8bit()` should be reused | **TRUE** |
| B8 | Task order knowingly leaves the suite broken across commits | Task 2 repoints light-mode text from bright primary to dark `interactive`, so screenshots fail **at Task 2** — not "at Task 4" as the plan claims. Tasks 2–3 commit on `verify.sh --fast` while the plan's own preamble says every task's done-ness is full `verify.sh` | **TRUE** |
| B9 | Meaningful control boundaries routed to a floorless token | `components/ui/button.tsx:15` outline = `border border-input …`. Task 4 maps `--input` → `--border-subtle`, which the plan itself defines as decorative with **no floor**. Directly contradicts the plan's own WCAG 1.4.11 reasoning | **TRUE** |
| B10 | Phase never delivers the deep panel, and omits the required ramp | `--panel` is defined but no component is migrated to it. Spec `:215` — "### Build a 9-step teal ramp in OKLCH" — is never constructed | **TRUE** |
| SF1 | Snapshot approval too weak | Gate omits `token-contract`; "inspect one light diff" skips dark and two widths. Screenshot tests force themes explicitly, so they cannot prove `defaultTheme` changed | **TRUE** |
| SF2 | `RGB` type alias unused | Would trip the plan's own silent-lint requirement | **TRUE** |
| NIT | "eight roles" lists ten tokens; "three cases" presents four | Internal inconsistency | **TRUE** |

---

## Root cause of Plan B's failure

Three mistakes, one theme — **I asserted colour relationships instead of measuring them,
in a plan whose entire subject is measured colour**:

1. **I measured the anchors, then hand-reasoned the pairings.** The five anchor values were
   browser-verified. The *pairs* in `FLOORS` were not, so a 1.14:1 pair got written into a
   table demanding 4.5:1.
2. **I wrote a new measurement helper instead of reusing the repo's.** `sample8bit()` exists
   precisely because `getComputedStyle` preserves `oklch()`. Phase 0 learned this lesson and
   documented it in a comment I had already read.
3. **I inventoried one surface (TSX utilities) and called it the inventory.** The authored
   CSS carries 20 more usages and the pseudo-elements carry the section numbers.

The corrective rule for the redesign: **no contrast number enters a plan unless it came out
of a browser**, and **every colour check reuses `sample8bit()` + `setTheme()`**.

## Disposition

- Plan A: fix the 3 blockers + 4 should-fix in place. Architecture is sound.
- Plan B: **superseded** — rewritten rather than patched. The contrast contract, the
  enforcement mechanism, the inventory, and the task order all change, which is most of the
  plan.
