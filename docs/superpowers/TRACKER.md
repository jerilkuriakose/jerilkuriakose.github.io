# Redesign tracker

Everything derivable from the repo is **derived**, not written here:

```bash
bash scripts/redesign-status.sh
```

That prints phases, plans, checkbox progress, blocking human gates, review verdicts,
override warnings, live build/tsc/lint results, and the installed stack. **None of it is
hand-maintained, so none of it can go stale.**

| Source of truth | For |
|---|---|
| `specs/2026-08-31-portfolio-redesign-design.md` | Decisions, phases, gates (the `- [ ] G1..G4` checkboxes are canonical), out-of-scope |
| `plans/*.md` | Task breakdown. **Checkboxes are the progress store** |
| `reviews/*.md` | Review verdicts + which findings were overridden and why |
| `git` | What changed, what is committed |
| `../../AGENTS.md` (workspace root) | Environment traps, tooling, definition of done |

---

## The only hand-maintained state

**Next action:** **The redesign is complete.** All seven phases (0, 1a, 1b, 2, 3, 4, 5, 6) are
shipped and all four human gates G1–G4 are closed. G2 was approved on 2026-09-01 against the real
`hero-ink` / `contact-glass` imagery, which was the last blocker. `verify.sh` is green at **99
tests**; Phase 5's 8 mutation categories are all proven to fail via
`/tmp/opencode/phase5-mutations.sh`.

There is no queued work. Anything further is new scope — the out-of-scope list in the spec §12
(LaTeX→Typst/Puppeteer PDF migration, Arabic/RTL, print styles, contact form, analytics) is the
place to start, and none of it is committed to.

Phase 6 closed every §9 accessibility gap. Phase 5 finished the overflow story: Phase 6 reported
0px, but that gate sampled once immediately after `networkidle`, i.e. at animation frame 0. The
hero's outer ring was a 288px **square** with `rounded-full` spun by `animate-[spin]`, so its
*rotated bounding box* grew to 404.6px and overflowed a 375px viewport — 0px at t=0, 7px from
500ms on. The live pre-Phase-5 site measures the same 7px, so it was never a Phase 5 regression.
Spinning a uniform annulus is a visual no-op, so the animation was removed and the gate now
samples over time and takes the worst reading.

Four rules this project has paid for. They apply to every later phase:

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

Do not read serialized colour strings to compare colours: the build downlevels `oklch()` to a
hex + `lab()` pair, and OKLab `L` and CIELab `L*` are different scales. Compare **bytes**.

---

## When to update this file — write-through, never batched

Update **in the same turn the fact changes.** Do not wait for "the end of the session" —
a session can be compacted, truncated, or abandoned without warning, so any rule keyed to
an unobservable boundary silently never fires.

Write through on these observable events:

- a review verdict arrives → **write a file to `reviews/`** (do not summarise it here)
- a human gate is answered → **tick its checkbox in the spec** (do not restate it here)
- a phase's progress changes → **tick checkboxes in its plan** (do not restate it here)
- **the next action changes → update this file** ← the only case that touches this file
- you are about to stop and wait for the user, or hand off to a long-running subagent →
  make sure the above are already written

The pattern: almost every state change belongs in an **artifact**, not in this tracker.
Writing the artifact *is* the update. This file holds one sentence because that is all
that cannot be derived.

**Do not** treat this file as evidence of completion. Anthropic, Cursor and LangChain all
converge on validating completion with tests and CI rather than prose — a green gate in
the status script outranks any sentence written here.

5. **A custom property's `var()` is substituted where the property is DECLARED, not where it
   is used.** This has now broken two phases in different disguises: `--muted-foreground:
   var(--ink-muted)` on `:root` ignored a scope override (Phase 2), and `--font-display:
   var(--font-newsreader)` on `:root` resolved to nothing because `next/font` put the provider
   variable on `<body>` (Phase 3). If a token references another token, they must be declared
   at the same level or higher.
6. **Tailwind 4.3.3 strips author content inside `@layer components`.** Write custom classes as
   plain CSS. They then outrank every Tailwind layer, so a stale utility loses silently rather
   than loudly — assert the rendered result.
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
