# Oracle re-review — Phase 2 rewrite (2nd pass)

**Date:** 2026-09-01
**Artifact:** `plans/2026-09-01-phase2-palette-retune.md` (the rewrite that followed the first `REDESIGN`)
**Verdict:** `REDESIGN` — 8 blockers, 4 should-fix
**Triage: every finding checked was TRUE. Nothing overridden. The lead finding invalidated my own measurement method.**

---

## The finding that matters most: my gamut measurement was invalid

I wrote "no contrast number enters a plan unless a browser produced it" into the previous
review, then produced the ramp with a **broken browser measurement**.

**What I did:** binary-searched chroma upward, comparing the rendered 8-bit bytes of
`oklch(L C H)` against `oklch(L C+0.0015 H)`, and treated the point where the bytes stopped
changing as the gamut cap.

**Why it is wrong:** out-of-gamut colours are not clamped to a single fixed sRGB value.
Chromium *gamut-maps* them, and the mapping keeps producing different bytes well past the
boundary. So the search found where the mapping saturates in 8-bit output — far outside the
real gamut. It reported caps of 0.2011 / 0.1630 / 0.3039 where the truth is 0.1305 / 0.1095 / 0.0696.

**The correct method — round-trip through relative colour syntax:**

```js
// render the requested colour, sample the real bytes, then ask the ENGINE what
// OKLCH those bytes actually are:
//   color: oklch(from rgb(R G B) l c h)
// If the readback chroma is materially lower than requested, the browser
// gamut-mapped and the authored value was never in gamut.
```

Verified against the authored ramp — clipping on exactly the three steps Oracle named:

| Step | Authored C | Round-trip C | Hue drift | |
|---|---|---|---|---|
| `--teal-400` | 0.147 | 0.14689 | 171 → 171.1 | in gamut |
| `--teal-500` | 0.150 | **0.13480** | 171 → **168.5** | **clipped** |
| `--teal-600` | 0.130 | **0.11361** | 171 → **167.7** | **clipped** |
| `--teal-700` | 0.0862 | 0.08560 | 171 → 171.3 | in gamut |
| `--teal-800` | 0.070 | **0.06859** | — | **at/over the boundary** |

Oracle's computed caps (0.12928 / 0.10773 / 0.06856) land within ~1.6% of the true caps
measured by round-trip (0.1305 / 0.1095 / 0.0696) — and for step 800 its 0.06856 matches the
readback 0.068589 to four decimals. Its arithmetic was sound; my measurement was not.

**Methodological caveat worth keeping.** A naive round-trip predicate that also demands hue
stability rejects the *low-chroma* steps (100/200/300) as false positives: at C ≈ 0.006 the
hue angle is numerically ill-conditioned, so 8-bit rounding swings it by ~0.8°. Gate on
**chroma and lightness**, and scale any hue tolerance by chroma.

## Corrected ramp — all nine round-trip clean, curve preserved

| Step | OKLCH | Hex | on canvas | on panel |
|---|---|---|---|---|
| 100 | `oklch(0.977 0.006 171)` | `#F4F9F7` | 1.00 | 12.61 |
| 200 | `oklch(0.93 0.022 171)` | `#DAEDE6` | 1.15 | 11.01 |
| 300 | `oklch(0.86 0.070 171)` | `#A2E0CB` | 1.40 | 8.98 |
| 400 | `oklch(0.773 0.147 171)` | `#1ED3A9` | 1.80 | 6.99 |
| 500 | `oklch(0.66 0.128 171)` | `#09AB88` | 2.74 | 4.59 |
| 600 | `oklch(0.55 0.107 171)` | `#038569` | 4.33 | **2.91** |
| 700 | `oklch(0.44 0.0862 171)` | `#00624C` | 7.01 | 1.80 |
| 800 | `oklch(0.35 0.068 171)` | `#014636` | 10.22 | 1.23 |
| 900 | `oklch(0.26 0.030 171)` | `#142922` | 14.41 | 1.14 |

Luminance strictly monotonic; nine distinct hexes; every step round-trips.

**Cascading consequence — the fix breaks a role assignment.** Corrected `--teal-600` on the
panel is **2.91:1**, under the 3:1 the plan assigns `--border-strong` in dark mode. The old
number (3.05) was an artefact of the clipped colour. `--teal-500` (#09AB88, 4.59:1 on panel)
is the candidate replacement. **This is the general lesson: correcting the gamut changes the
contrast numbers, which changes which step each role may point at.** The role table must be
re-derived from the corrected ramp, not patched.

---

## Verification of the remaining findings

| # | Finding | Checked | Verdict |
|---|---|---|---|
| B1 | Ramp not fully in gamut (500/600/800) | Round-trip above | **TRUE** |
| B2 | `setTheme()` called after `goto()` | `helpers.ts:5` says "Set the theme BEFORE first navigation"; it only installs an init script, which applies at the *next* navigation. My Task 1 Step 6 test calls `goto()` then `setTheme()` | **TRUE** |
| B3 | Task 1 tests a `--destructive` it never defines | Task 1 Steps 2–3 define no destructive role; Step 6 samples `--destructive`, which until Task 3 still holds the *old* base value | **TRUE** |
| B4 | Floor table omits real failing pairs (dark focus on dark muted 2.89:1; dark `destructive-foreground` on `destructive` 2.68:1) | Consistent with the corrected ramp, and `button.tsx`/`badge.tsx` do use that foreground/background pair. Requires re-measurement against the corrected ramp | **TRUE, pending re-measure** |
| B5 | Task 2 demands the Phase-0 `hsl()` literal be both present and absent | Task 2 adds `expect(CSS.match(/hsl\(/g)).toBeNull()` while `source-contract.spec.ts:31` still asserts the literal is present, and Task 3 Step 9 is what retires it | **TRUE** |
| B6 | Task 3 gates miss hardcoded expectations beyond the 46 + 5 | `source-contract.spec.ts:38` pins exact `var(--primary) N%` percentages; `token-contract.spec.ts:126` and `:244` hold further hardcoded arrays | **TRUE** |
| B7 | Panel migration not decision-complete; `text-panel-foreground` on a parent does not override descendants carrying `text-foreground`/`text-muted-foreground`/`text-interactive` | Correct as CSS: `color` inherits only where not re-declared, and light `interactive` on panel is 2.36:1 | **TRUE** |
| B8 | Inventory omits the custom scrollbar | `globals.css:121`+ styles a scrollbar with translucent `muted-foreground` thumb; the plan neither classifies nor contrast-tests thumb-vs-track | **TRUE** |
| SF1 | `--accent` left stale (only `--color-accent` is repointed) | Correct — the declaration survives unreferenced | **TRUE** |
| SF2 | The 38/27 TSX counts go stale after Phase 1a | **Now confirmed empirically**: Phase 1a is merged and added `text-primary` in `HeroProofRow` *and* `RoleMetrics`. Counts must be regenerated, not reused | **TRUE** |
| SF3 | One atomic *commit* is right; one atomic *task* is too large | 11 steps spanning base mapping, 50+ call sites, panel design, theme flip, gradients, token re-measurement and 6 snapshot approvals | **TRUE** |
| SF4 | Ramp test permits drift — order + uniqueness only | It cannot detect authored-gamut violations at all, which is how B1 survived | **TRUE** |

Oracle's own inventory cross-check confirmed my count of 20 `var(--primary)` usages with
exactly 3 text sites and 2 outlines, and found no raw hex or `currentColor` in `globals.css`.
The scrollbar is the one classification I missed.

## Disposition

Phase 2 needs a **third pass** before execution. The three-layer architecture survives; the
measured layer does not. Required, in order:

1. Re-derive the role table from the corrected ramp (B1 forces this; `border-strong` dark is
   already known broken at 2.91:1).
2. Fix test ordering: `setTheme()` before `goto()`, and assert the resulting `html` class.
3. Introduce a non-consuming `--destructive-role` in Task 1 so Task 1 tests what Task 1 defines.
4. Complete the per-theme floor matrix, including every muted-surface and destructive-fill pair.
5. Keep Task 2's narrower `no hsl(var(...))` invariant; move the `no raw hsl()` assertion to Task 3.
6. Enumerate every hardcoded expectation in both harnesses, not just `EXPECTED` + `COMPOSITED`.
7. Name the exact panel surfaces and every descendant role that must be re-scoped.
8. Classify and contrast-test the scrollbar thumb-vs-track as a non-text boundary.
9. Regenerate the usage inventory now that Phase 1a is merged.
10. Split Task 3 into no-commit verification milestones, retaining one final atomic commit.

**Phase 2 is not blocked on anything external — only on this rework.** Phase 1a is complete
and green, so nothing downstream is waiting.
