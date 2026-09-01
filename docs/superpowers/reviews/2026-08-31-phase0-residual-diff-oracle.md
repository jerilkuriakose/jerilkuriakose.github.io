# Oracle review — Phase 0 residual pixel difference

**Reviewed:** the *executed* Phase 0 conversion, mid-execution, when the harness went red
**Reviewer:** Oracle (read-only consultation agent)
**Date:** 2026-08-31
**Verdict:** `INVESTIGATE` — "the conversion is not yet correct under the stated contract"
**Disposition:** both defects fixed and verified. Review is **closed**.

Consulted because the token contract passed (all 46 tokens byte-identical) while all six
screenshots failed, and deciding whether to accept or reject that was a judgement call
rather than a measurement.

---

## Two defects, both real, both fixed

### 1. Wrong Oklab matrices — Oracle found this, I had missed it entirely

The first conversion derived OKLCH coordinates in Python using the **older published
Oklab matrices**. Browsers use the revised CSS Color 4 matrices. Oracle quoted the correct
values and they matched the engine to the digit:

| HSL | First attempt (wrong) | Browser (correct) |
|---|---|---|
| `166 76% 47%` | `oklch(0.773404 0.147474 170.8866)` | `oklch(0.773355 0.147425 170.885)` |
| `166 100% 70%` | `oklch(0.908654 0.139721 174.8630)` | `oklch(0.908635 0.139697 174.846)` |

Why it slipped through: **opaque 8-bit canvas sampling quantises both to the same byte**,
so the per-token contract passed. Alpha compositing and antialiasing do not quantise the
same way, which is what the screenshots were detecting.

**Fix:** all 17 values now come from the rendering engine itself via
`oklch(from hsl(...) l c h)` read back through `getComputedStyle`. The renderer is the
only authority worth trusting here.

### 2. Gradient interpolation space — I found this independently, Oracle confirmed and extended it

Introducing any non-legacy stop (`oklch()`, `color-mix()`) flips a gradient's default
interpolation space from gamma-encoded **sRGB to Oklab**. Measured in isolation with the
same two colours in both notations:

| ramp position | hsl stops | oklch stops | delta |
|---|---|---|---|
| t=0.0 | `(29,211,168)` | `(30,211,168)` | 1 |
| t=0.3 | `(88,217,190)` | `(118,218,190)` | **30** |
| t=1.0 | `(225,231,240)` | `(225,231,240)` | 0 |

Endpoints match; the middle of every ramp shifts by up to **30/255**. I had initially
attributed the page diff to `color-mix` rounding — measurement refuted that: `hsl(x/.3)`
and `color-mix(in oklab, x 30%, transparent)` composite to *exactly* the same bytes, and
Tailwind's opacity utilities were identical regardless of input notation. Gradients were
the whole cause.

Oracle extended the finding correctly: I had focused on `.gradient-text` (the one with
*mixed* spaces), but **all five** authored gradients were affected, since any of them
having converted stops changes its interpolation.

**Fix:** all five gradients pin `in srgb` explicitly. Verified to reduce max delta from
30 → 1. Alpha derivations also moved from `color-mix(in oklab, …)` to
`color-mix(in srgb, …)` per Oracle's recommendation, following the original HSL→sRGB path.

## Oracle also corrected a metric error of mine

I reported "zero pixels differing by more than 7". That was measured on the **luminance**
of the difference image. Oracle measured **per-channel** and found 38–41 dark-mode pixels
over 7. Oracle's metric is the correct one; my claim was true only under a weaker
aggregate.

## Rejected recommendation, with reason

Oracle advised regenerating tokens at "9–12 significant decimal digits". Not done: the
engine's own serialisation is what it will render, and it emits ~6 significant figures
(`oklch(0.773355 0.147425 170.885)`). Adding invented precision beyond what the source of
truth reports would be false confidence, and the composited-byte tests confirm the
engine's own values are exact.

## Threshold policy — followed exactly as advised

Oracle: *"Do not change playwright.config.ts now… If a residual remains only after
standards-correct token conversion and explicit interpolation restoration, assess it with
a one-time migration comparator, approve and regenerate the baseline, then retain zero
tolerance against the new baseline. Do not carry the migration allowance into permanent
test configuration."*

Residual after both fixes, assessed before regenerating:

- 3–770 pixels per image (**0.00–0.01%**), down from 40,230–43,495
- max per-channel delta **1–2**, down from 9
- **zero** pixels over 7 per-channel
- **100% of sampled differing points isolated**, zero clustered → antialiasing scatter,
  not a colour region

Baseline regenerated **once**, deliberately, on that evidence. `playwright.config.ts`
still holds `maxDiffPixels: 0, threshold: 0`. Final: 60 passed over `--repeat-each=3`.

## Harness gaps Oracle asked me to close (done)

- Composited alpha assertions over the **real** page background demanding exact bytes —
  un-premultiplied sampling hides rounding. Every expected value measured from the
  pre-conversion build in a worktree, not calculated: naive sRGB arithmetic disagreed by 1
  on two channels because compositing is premultiplied at 8-bit.
- Assertions on Tailwind's **generated** opacity utilities (`bg-primary/10`,
  `bg-primary/20`, `border-primary/20`), whose `color-mix` input representation changed
  when `@theme inline` was unwrapped.

Contract suite: **14/14 pass.**
