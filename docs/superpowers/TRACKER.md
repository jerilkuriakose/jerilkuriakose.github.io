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

**Next action:** **Phases 0, 1a, 2 and 3 are complete, pushed and deployed** (`verify.sh`
green, 60 tests). The site is light-default deep teal on a 9-step OKLCH ramp, with Newsreader
as the serif display face on a fully pinned type scale. **Phase 4 (motion correctness) is
next** and is unblocked. Phase 1b is blocked on **G3**; Phase 5 shipping on **G4**.

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
