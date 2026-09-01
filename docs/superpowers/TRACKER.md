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

**Next action:** execute Phase 0 — the plan is Oracle-reviewed and needs no human input.
Phase 1 is the highest-value phase but is blocked on gate **G3**.

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
