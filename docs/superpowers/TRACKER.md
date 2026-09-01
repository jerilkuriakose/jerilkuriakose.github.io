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

**Next action:** **Phase 1a is complete and committed** (`d926de5` + `b7eecb9`, 27/27 steps,
`verify.sh` all green). The **Phase 2 plan is on its third pass** and is ready to execute —
the two `REDESIGN` verdicts behind it are in `reviews/`, and its closing table lists every
defect the earlier drafts shipped so they are not reintroduced. Phase 1b remains blocked on
**G3**. Nothing is pushed: `origin/main` is still at `31648c3`, so the live site serves the
old Next 14 build.

Three rules this project has paid for. They apply to every later phase:

1. **No contrast number enters a plan or a test unless a browser produced it** — and the
   measurement must be a **round-trip**: render `oklch(...)`, sample the bytes, read them back
   with `oklch(from rgb(...) l c h)`. Out-of-gamut colours are *gamut-mapped, not clamped*, so
   growing chroma until the rendered bytes stop changing finds where the mapping saturates,
   not the gamut edge. That error put three ramp steps outside sRGB.
2. **Every colour check reuses `sample8bit()` and `setTheme()` from `tests/visual/helpers.ts`**,
   and `setTheme()` runs **before** `goto()` — it only installs an init script.
3. **A role that is legal on one surface is often illegal on another.** Verify every role
   against every surface it can land on, per theme. Single-value-per-role is provably
   unsatisfiable here: no one `--focus` clears 3:1 on all six surfaces, and no ramp step works
   as a border on both the light canvas and the deep panel.

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
