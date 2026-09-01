# Oracle review — Phase 4 motion plan

**Date:** 2026-09-01
**Artifact:** `plans/2026-09-01-phase4-motion-correctness.md`
**Verdict:** `FIX-FIRST` — 3 blockers, 7 should-fix, 2 nits. **All verified; nothing overridden. All fixed.**

---

## The three blockers

| # | Finding | Verification | Verdict |
|---|---|---|---|
| B1 | Gating `initial` on `useReducedMotion()` renders the **server HTML hidden**. The hook returns `null` on the server but `true` immediately on a reduced-motion client, so SSR emits `initial="hidden"` and the client hydrates `"visible"` — React mismatch plus a visible flash before JS runs | `framer-motion/dist/es/utils/reduced-motion/use-reduced-motion.mjs:37` is `useState(prefersReducedMotion.current)`, reading a module ref that is unset server-side | **TRUE** |
| B2 | The scroll-trigger test **passes against the unfixed component** | Contact's reveal is `delay: BLUR_FADE_DELAY * 36` = 1.44s, plus 0.04s + 0.4s duration = **1.88s**. Sampling at 1500ms catches the *old load-triggered* animation still mid-flight; the later scroll lets it finish. "Hidden before, visible after" with the observer never involved | **TRUE** |
| B3 | §7's second Rules sentence was **not implemented** while the self-review claimed full coverage | "Motion at narrative moments only — never uniform decoration on every element." Measured on production: **92** reveal wrappers. `skills.tsx` wraps each of 40 chips; `social-rail.tsx` each link; publications/awards/education each item | **TRUE** |

B1 is the sharpest: the plan's own goal was "instant, never hidden", and its implementation
would have delivered a hidden first paint to exactly the users the feature exists for. The fix
moves the guarantee into CSS, which wins the race with JS.

## Should-fix, all verified

- **Dock shape** — "bypass `useSpring`" invites a conditional hook call. Correct shape: both hooks unconditional, switch at `style={{ width: shouldReduce ? DEFAULT_SIZE : width }}`; a plain number is valid Motion style input.
- **Dock test unrunnable** — `MobileDock` is `lg:hidden`, so at the default 1280 viewport it is not rendered at all.
- **`inViewMargin: "-50px"`** shrinks **all four** root edges, so an element inside the first 50px of the document can never intersect. Bottom-only `"0px 0px -50px 0px"`.
- **Identity test** would pass trivially if `lockMotion()` ran first — it injects `transform: none !important`.
- **`revealAll()`** relied on a bare 120ms timeout and `body.scrollHeight`, which excludes fixed rails and can coalesce observer callbacks.
- **Filter source contract** checked four hardcoded files and one spelling; misses masks, `backdropFilter`, alternate syntax, and future files.
- **Three reduced-motion assertions** could pass pre-fix by sampling at the wrong moment.

## Nits

- `useReducedMotion` **is** exported from `motion/react` (verified at runtime), but 13.1.1 is **not reactive** — `useState` with no setter, so a preference change does not re-render. My plan claimed otherwise.
- Destructuring an unused `blur` would fail lint, and `verify.sh` gates on lint.

## Independent measurement that strengthened the plan

Before the review returned I verified the headline defect on **production**, since the spec
asserted it without my having checked:

| Signal | Count |
|---|---|
| `matrix(1, 0, 0, 1, 0, -6)` | **92** |
| residual `filter: blur(0px)` | **93** |
| contact `opacity: 1` with no scrolling | confirms load-triggered |

The spec estimated ~30 affected elements. It is **92**. And the `blur(0px)` residue is a defect
the spec never named: a non-`none` filter creates a containing block and promotes a compositing
layer, so 93 elements pay layer cost for an invisible effect.

## The one ambiguity resolved explicitly

§7's Rules say "animate `transform` and `opacity` only", while its own reduced-motion paragraph
requires "disclosure height animation becomes instant" — which presupposes that animation
exists. Both cannot hold literally. The plan now records the resolution rather than resolving it
silently: **the disclosure keeps its `height` animation**, as §7 names it and the
motion-performance skill permits layout animation on a small, isolated, one-shot, user-initiated
surface. It is the only permitted layout animation in the codebase.

## Pattern, fourth phase running

Three of Oracle's findings were again **gates that prove nothing** — the vacuous scroll-trigger
test, the identity test defeated by `lockMotion()`, and three reduced-motion assertions that
pass pre-fix. That is now four consecutive phases where the decisive defect was a test rather
than the code. The rule holds: run every new gate against a deliberately injected version of the
defect and watch it fail before trusting it.
