# Redesign tracker — CLOSED

**Status: complete. No queued work.** All seven phases (0, 1a, 1b, 2, 3, 4, 5, 6) shipped
and all four owner gates G1–G4 closed on 2026-09-01. G2 — owner sign-off on a first
viewport rendered with real final-quality imagery — was the last blocker.

Everything derivable from the repo is **derived**, not written here:

```bash
bash scripts/verify.sh              # build + tsc + lint + the 99-test visual harness
bash scripts/redesign-status.sh     # phases, gates, reviews, override warnings, live state
```

| Source of truth | For |
|---|---|
| `specs/2026-08-31-portfolio-redesign-design.md` | Decisions, phases, gates (`G1..G4` checkboxes are canonical), §11b accepted-not-defects, §12 out of scope |
| `plans/*.md` | Task breakdown. **Checkboxes are the progress store** — 188 steps, all closed |
| `reviews/*.md` | Review verdicts + which findings were overridden and why |
| `git` | What changed, what is committed |
| `../../AGENTS.md` (workspace root) | Environment traps, tooling, definition of done |

Anything further is **new scope**. The spec §12 out-of-scope list (LaTeX→Typst/Puppeteer PDF
migration, Arabic/RTL, print styles, contact form, analytics) is the place to start, and
none of it is committed to.

---

## Rules this project paid for

These are the non-obvious ones — each cost real debugging, and none is visible by reading
code. They apply to any future work in this repo, not just the redesign.

1. **No contrast number enters a plan or a test unless a browser produced it** — and the
   measurement must be a **round-trip**: render `oklch(...)`, sample the bytes, read them back
   with `oklch(from rgb(...) l c h)`. Out-of-gamut colours are *gamut-mapped, not clamped*, so
   growing chroma until the rendered bytes stop changing finds where the mapping saturates,
   not the gamut edge. That error put three ramp steps outside sRGB.
2. **Every colour check reuses `sample8bit()` and `setTheme()` from `tests/visual/helpers.ts`**,
   and `setTheme()` runs **before** `goto()` — it only installs an init script.
3. **A role legal on one surface is often illegal on another.** Verify every role against every
   surface it can land on, per theme. Single-value-per-role is provably unsatisfiable here: no
   one `--focus` clears 3:1 on all six surfaces, and no ramp step works as a border on both the
   light canvas and the deep panel.
4. **Overriding a role does NOT reach the base tokens.** `--muted-foreground: var(--ink-muted)`
   declared on `:root` substitutes its `var()` *at `:root`*, and the resolved colour inherits —
   so a scope that re-points `--ink-muted` leaves `text-muted-foreground` untouched. Any surface
   scope must re-declare the base tokens too. Caught only by asserting the **painted** colour of
   a real utility; the role-level assertion passed while `text-foreground` sat at 1.14:1.
5. **A custom property's `var()` is substituted where the property is DECLARED, not where it
   is used.** This broke two phases in different disguises: `--muted-foreground:
   var(--ink-muted)` on `:root` ignored a scope override (Phase 2), and `--font-display:
   var(--font-newsreader)` on `:root` resolved to nothing because `next/font` put the provider
   variable on `<body>` (Phase 3). If a token references another token, they must be declared
   at the same level or higher.
6. **Tailwind 4.3.3 strips author content inside `@layer components`.** Write custom classes as
   plain CSS. They then outrank every Tailwind layer, so a stale utility loses silently rather
   than loudly — assert the rendered result. This also means Tailwind inset/colour utilities
   **lose** against a plain-CSS class that sets the same property.
7. **A gate that samples once samples frame 0.** Phase 6's overflow gate read `scrollWidth`
   immediately after `networkidle` and reported 0 while the page genuinely overflowed by 7px for
   ~95% of every animation cycle, because a rotating square's bounding box is smallest at
   rotation 0. Anything driven by an animation must be sampled **over time** and reduced to the
   worst reading.
8. **Chromium's CSSOM aliases `-webkit-backdrop-filter` onto the standard property.**
   `rule.style.cssText` reports only `backdrop-filter`, so a CSSOM check for the prefix can
   never fail — it passes even with the prefix deleted. Assert vendor prefixes against the
   **built stylesheet**, not the CSSOM.
9. **`transition-property`'s initial value is `all`.** `getComputedStyle(el).transitionProperty`
   returns `"all"` for every element that declares no transition, so auditing it alone flags
   everything. A transition only exists if `transition-duration` is non-zero.
10. **`backdrop-filter: none` cannot emulate missing support.** `@supports` still matches, so the
    enhancement stays active and a fallback test proves nothing. Delete the gated rule from the
    CSSOM instead, and confirm the computed value actually changed.
11. **A radial mask needs `closest-side`.** With the default `farthest-corner`, the nearest edge
    sits only ~43% along the gradient and stays opaque, so a masked panel ships a hard line down
    one side. Only `closest-side` guarantees all four edges reach transparent.

**Compare bytes, never serialized colour strings.** The build downlevels `oklch()` to a hex +
`lab()` pair and the `lab()` form wins in Chromium, so an `rgba()` regex silently matches
nothing. OKLab `L` and CIELab `L*` are also different scales — a number from one is not
comparable to the other.

**Measure perceptual differences in OKLab, not WCAG luminance.** Raw luminance ranked the
light/dark photo asymmetry backwards; OKLab matched what the screenshots actually showed.

### The meta-pattern, across all seven phases

The decisive defect was almost always **a gate that proved nothing** — not broken code.
Phase 5 alone found four: a CSSOM prefix check that could not fail, an audit flagging
`transition-property: all` on every element, a fallback test whose emulation did not work,
and a helper that hung on a lazy offscreen image. So: **run every new assertion against a
deliberately injected version of the defect and watch it fail before trusting it.**
`/tmp/opencode/phase5-mutations.sh` is the worked example — 8 categories, all confirmed.

**Known gap, recorded in spec §11b:** nothing asserts the photographs are *visible*. 99 green
tests would not catch a photo veiled out of existence.

---

## If you start a NEW multi-session project here

Restore write-through discipline. It is the single practice that carried this project across
many compactions.

Update the artifact **in the same turn the fact changes.** Never wait for "the end of the
session" — a session can be compacted, truncated, or abandoned without warning, so any rule
keyed to an unobservable boundary silently never fires.

- a review verdict arrives → **write a file to `reviews/`** (do not summarise it here)
- a human gate is answered → **tick its checkbox in the spec** (do not restate it here)
- a phase's progress changes → **tick checkboxes in its plan** (do not restate it here)
- **the next action changes → update this file** ← the only case that touches this file
- you are about to stop and wait for the user, or hand off to a long-running subagent →
  make sure the above are already written

Almost every state change belongs in an **artifact**, not in this tracker. Writing the
artifact *is* the update. This file stays short because that is all that cannot be derived.

**Do not** treat this file as evidence of completion. A green gate in the status script
outranks any sentence written here.
