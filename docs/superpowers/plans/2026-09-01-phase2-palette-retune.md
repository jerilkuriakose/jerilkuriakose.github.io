# Phase 2 — Palette retune to light-default deep teal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Third pass.** Two prior drafts were reviewed `REDESIGN`. Both verdicts are the record:
`reviews/2026-09-01-phase1a-phase2-plans-oracle.md` and
`reviews/2026-09-01-phase2-rewrite-oracle-2nd.md`. Read **"What changed in this pass"** at the
bottom before executing — it lists defects the earlier drafts actually shipped, so several
obvious-looking simplifications are known to be wrong.

**Goal:** Replace the navy/bright-teal palette with the light-default deep-teal system from
spec §3, built on a **9-step OKLCH ramp** with **per-theme, surface-scoped semantic roles**,
and reclassify every brand-colour usage so nothing illegal ships.

**Architecture — four layers, each with one job:**

1. **Ramp primitives** `--teal-100..900` — the 9 steps spec §3 requires. Raw colour, no meaning. Theme-independent.
2. **Semantic roles** — `ink`, `interactive`, `focus`, `border-strong`, … each pointing at a ramp step. **Per theme**, because several roles provably cannot share one value across themes.
3. **Surface scope** — an `.on-panel` block re-pointing the same role names for content on the deep panel. Required: a role legal on the canvas is often illegal on the panel.
4. **Base shadcn tokens** — `--background`, `--foreground`, `--border`, … repointed at roles. This is the layer existing components already consume, so it is the layer that actually renders.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, Tailwind 4.3.3 (`@theme inline`), `@playwright/test` 1.62.1.

**Spec:** implements **Phase 2** of §15 plus §3's `### Build a 9-step teal ramp in OKLCH`.

**Depends on:** Phase 1a — merged at `d926de5`. Milestones 3d–3f edit `components/sections/*` and `components/chrome/*`, which that commit created.

---

## Global Constraints

- Node `>=20.9.0`. Do **not** upgrade ESLint past 9.x.
- Gradients pin `in srgb`; alpha uses `color-mix(in srgb, …)`, never `in oklab`.
- **Every colour sample reuses `sample8bit()` from `tests/visual/helpers.ts`.** Never parse `getComputedStyle().color` — it returns `oklch(...)` verbatim.
- **`setTheme(page, theme)` is called BEFORE `page.goto()`**, per its docstring at `helpers.ts:5` — it only installs an init script, applying at the *next* navigation. `token-contract.spec.ts:123` is the correct in-repo idiom; copy it.
- **No colour value enters this plan or its tests unless a browser round-trip verified it.**
- `bash scripts/ensure-browser-deps.sh` before browser work — the libs are ephemeral.

## The gamut rule — non-negotiable, and the reason this is a third pass

An out-of-gamut OKLCH colour is **gamut-mapped, not clamped**. Chromium keeps emitting
*different* bytes well past the sRGB boundary, so growing chroma until the rendered bytes stop
changing finds where the **mapping saturates**, not the gamut edge. Draft 2 used that method,
put three ramp steps outside sRGB — hue drifting up to 3.3° — and its test reported green.

**The only valid check is a round-trip:**

```js
// render the requested colour, sample the real bytes, then ask the ENGINE what
// OKLCH those bytes actually are:  color: oklch(from rgb(R G B) l c h)
// In gamut => readback L and C match the request. Mapped => readback C is lower.
const inGamut = (L, C, H) => {
  const back = readback(sampleBytes(`oklch(${L} ${C} ${H})`));
  return Math.abs(back.C - C) < 0.001 && Math.abs(back.L - L) < 0.004;
};
```

**Gate on chroma and lightness only.** Hue is ill-conditioned at low chroma — at `C ≈ 0.006`
an 8-bit rounding swings the angle ~0.8° — so a hue tolerance yields false positives on
`--teal-100/200/300`.

---

## The measured token graph

Every value was rendered in Chromium 141, sampled from a 1×1 canvas, and **round-trip verified
in gamut**. Every ratio is measured. **Do not substitute values.**

### Ramp — `H = 171`, theme-independent, all nine round-trip clean

| Step | OKLCH | Hex | on light canvas | on deep panel |
|---|---|---|---|---|
| `--teal-100` | `oklch(0.977 0.006 171)` | `#F4F9F7` | 1.00 | 12.61 |
| `--teal-200` | `oklch(0.93 0.022 171)` | `#DAEDE6` | 1.15 | 11.01 |
| `--teal-300` | `oklch(0.86 0.070 171)` | `#A2E0CB` | 1.40 | 8.98 |
| `--teal-400` | `oklch(0.773 0.147 171)` | `#1ED3A9` | **1.80** | 6.99 |
| `--teal-500` | `oklch(0.66 0.128 171)` | `#09AB88` | 2.74 | 4.59 |
| `--teal-600` | `oklch(0.55 0.107 171)` | `#038569` | 4.33 | 2.91 |
| `--teal-700` | `oklch(0.44 0.0862 171)` | `#00624C` | 7.01 | 1.80 |
| `--teal-800` | `oklch(0.35 0.068 171)` | `#014636` | 10.22 | 1.23 |
| `--teal-900` | `oklch(0.26 0.030 171)` | `#142922` | 14.41 | 1.14 |

Luminance strictly monotonic; nine distinct hexes. **Steps 500, 600 and 800 carry corrected
chromas** — draft 2 authored 0.150 / 0.130 / 0.070, all outside the true caps 0.1305 / 0.1095 / 0.0696.

### Off-ramp values — where no ramp step satisfies the constraint

| Token | OKLCH | Hex |
|---|---|---|
| `--ink-muted` (light) | `oklch(0.50 0.020 171)` | `#586762` |
| `--interactive` (light) | `oklch(0.50 0.0979 171)` | `#00755C` |
| `--focus` (light) | `oklch(0.56 0.110 171)` | `#00896C` |
| `--focus` (dark) | `oklch(0.64 0.110 171)` | `#31A183` |
| `--destructive` (light) | `oklch(0.52 0.170 25)` | `#B63132` |
| `--destructive` (dark) | `oklch(0.70 0.150 25)` | `#ED756E` |

### Two impossibilities — searched, not assumed. This is why layer 3 exists

- **No single `--focus` serves both themes.** Swept `L` 0.30→0.80 at max in-gamut chroma against all six surfaces a ring can land on (light canvas/muted/panel, dark canvas/muted/panel): **zero candidates**. A ring needs ≥3:1 against `#F4F9F7` *and* `#014636`; those constraints do not intersect.
- **No ramp step works as `border-strong` on both the light canvas and the deep panel.** `--teal-600` is 4.33:1 on canvas but **2.91:1** on the panel.

### Roles — light theme (canvas `--teal-100`)

| Role | Value | Floor | Measured |
|---|---|---|---|
| `canvas` | `--teal-100` | — | — |
| `ink` | `--teal-900` | ≥7 | **14.41** |
| `ink-muted` | `#586762` | ≥4.5 | **5.59** |
| `brand-vivid` | `--teal-400` | fill only | 1.80 → never text |
| `on-brand` | `--teal-900` | ≥4.5 on brand | **7.99** |
| `interactive` | `#00755C` | ≥4.5 | **5.34** canvas · **4.66** muted |
| `display-accent` | `#00755C` | ≥3 | 5.34 |
| `border-strong` | `--teal-600` | ≥3 | **4.33** |
| `border-subtle` | `--teal-200` | none | — |
| `focus` | `#00896C` | ≥3 | **4.12** canvas · **3.60** muted |
| `destructive` | `#B63132` | ≥4.5 | **5.68** canvas · **4.96** muted |
| `destructive-foreground` | `--teal-100` | ≥4.5 on fill | **5.68** |
| `surface-muted` | `--teal-200` | ink ≥4.5 on it | 12.58 |

### Roles — dark theme (canvas = deep panel `#17342D`)

| Role | Value | Floor | Measured |
|---|---|---|---|
| `canvas` | `oklch(0.30 0.038 175)` | — | — |
| `ink` | `--teal-100` | ≥7 | **12.61** |
| `ink-muted` | `--teal-300` | ≥4.5 | **8.98** |
| `brand-vivid` / `interactive` | `--teal-400` | ≥4.5 | **6.99** canvas · **5.67** muted |
| `border-strong` | `--teal-500` | ≥3 | **4.59** canvas · **3.73** muted |
| `focus` | `#31A183` | ≥3 | **4.19** canvas · **3.40** muted |
| `destructive` | `#ED756E` | ≥4.5 | **4.71** |
| `destructive-foreground` | `--teal-900` | ≥4.5 on fill | **5.38** |
| `surface-muted` | `--teal-800` | — | — |

**`destructive-foreground` must be `--teal-900` on dark, not `--teal-100`.** Light-on-light
measures **2.68:1**, and `button.tsx`/`badge.tsx` really do render that foreground on that fill.

### `.on-panel` scope — content on the deep panel, in **either** theme

| Role inside `.on-panel` | Value | Floor | Measured |
|---|---|---|---|
| `ink` | `--teal-100` | ≥4.5 | **12.61** |
| `ink-muted` | `--teal-300` | ≥4.5 | **8.98** |
| `interactive` | `--teal-400` | ≥4.5 | **6.99** |
| `border-strong` | `--teal-500` | ≥3 | **4.59** |
| `focus` | `#31A183` | ≥3 | **4.19** |

Proof the scope is load-bearing: on the panel, light `--ink` is **1.14:1** and light
`--interactive` is **2.36:1**. A panel surface without this scope ships unreadable text.

---

## The full usage inventory — regenerated after Phase 1a

Draft 2's counts predated the decomposition. Re-counted at `d926de5`:

| Utility | Count | Disposition |
|---|---|---|
| `text-primary` | 38 | → `text-interactive`, or `text-display-accent` for large display text |
| `bg-primary` (+`/N`) | 14 | legal as fill; text on it → `on-brand` |
| `border-primary` (+`/N`) | 16 | control boundary → `border-strong`; decorative → `border-subtle` |
| `shadow-primary/N` | 2 | decorative |
| `text-muted-foreground` | 27 | → `ink-muted` via base token |
| `text-foreground` | 21 | → `ink` via base token |
| `border-border` | 17 | → `border-subtle` via base token |
| `bg-card` / `bg-background` | 7 / 4 | → `canvas` via base token |
| `bg-blue-400`, `to-blue-500`, `bg-green-500` | 3 | raw palette, bypasses the token system |

**Regenerate before starting** — `text-primary` now also lives in `HeroProofRow` and `RoleMetrics`:

```bash
for u in text-primary bg-primary border-primary text-muted-foreground text-foreground border-border bg-card bg-background; do
  printf "%-24s %s\n" "$u" "$(grep -rEoh "\b$u(/[0-9]+)?\b" app components --include='*.tsx' | wc -l)"
done
```

### Authored CSS — 20 `var(--primary)` sites no TSX grep can see

| Location | Rule | Kind |
|---|---|---|
| `globals.css:174` | `.numbered-heading::before` | **text**, **pseudo-element** |
| `globals.css:260` | `.tech-badge` | **text** |
| `globals.css:388` | `.cursor::after` | **text**, **pseudo-element** |
| `:343 :352` | `outline: 2px dashed` | **non-text, ≥3:1** → `focus` |
| `:154 :213 :224 :229 :259 :261 :266 :267 :315 :318` | `color-mix()` fills, shadows, borders | decorative |
| `:203 :283` | gradients | fill |
| `:245 :294` | `background-color` | fill |
| `:16` | `--color-primary: var(--primary)` | the `@theme inline` mapping |

**Two of the three text sites are pseudo-elements** — unreachable by a TSX grep *and* by any
DOM text walker, since generated content is not in the DOM. Only reading the stylesheet finds them.

### The scrollbar — a real failure both earlier drafts missed

`globals.css:121`+ restyles the scrollbar with a translucent `muted-foreground` thumb.
Measured against its track: **1.52:1 at 30%**, **2.09:1 at 50%**. Because the native control is
overridden, thumb-vs-track is a meaningful non-text boundary held to **3:1**. Fix: thumb →
`--border-strong` (**4.33** on the light canvas, **4.59** on the panel).

---

### Task 1: Ramp, roles, scope, and the contrast contract

Additive. Nothing consumes these yet, so no pixel moves — proving the declarations are
well-formed before anything depends on them.

**Files:** modify `app/globals.css`; create `tests/visual/contrast-contract.spec.ts`

- [ ] **Step 1: Add the 9 ramp primitives to `:root`** — from the ramp table. Theme-independent; declare once.

- [ ] **Step 2: Add the light roles to `:root`, the dark roles to `.dark`** — exactly as tabulated. `--focus` differs per theme; `--destructive-foreground` is `--teal-900` in dark.

- [ ] **Step 3: Add the `.on-panel` scope**

```css
.on-panel {
  --ink: var(--teal-100);
  --ink-muted: var(--teal-300);
  --interactive: var(--teal-400);
  --border-strong: var(--teal-500);
  --focus: oklch(0.64 0.110 171);
}
```

Declared once, outside both theme blocks — the deep panel is the same surface in either theme,
so the overrides are identical. Because these are custom properties, every descendant that
resolves `var(--ink)` inherits them automatically. That is exactly what a parent `text-*`
utility cannot do.

- [ ] **Step 4: Add a NON-CONSUMING `--destructive-role`**

Task 1's test must not sample `--destructive`: that base token still holds the **old** value
until 3a, where it measures ~3.55:1 light and ~1.36:1 dark against the new canvases — so Task 1
would fail on a value Task 1 never set. Declare `--destructive-role` and
`--destructive-role-foreground` here, test those, and wire the base token to them in 3a.

- [ ] **Step 5: Expose ramp, roles and scope through `@theme inline`** — `--color-teal-100..900` plus one `--color-*` per role.

- [ ] **Step 6: Prove nothing rendered changed**

```bash
bash scripts/ensure-browser-deps.sh
npm run build && npx playwright test
```

Expected: **all green, including the 6 screenshots.** Unused tokens must move no pixel.

- [ ] **Step 7: Write `tests/visual/contrast-contract.spec.ts`**

Seven requirements, each one a defect an earlier draft shipped:

1. `setTheme(page, theme)` **before** `page.goto()`, then assert `html` has/lacks `dark`. Copy `token-contract.spec.ts:123`.
2. `FLOORS` keyed **by theme**. A shared table is what made draft 1 unpassable.
3. Sample via `sample8bit()`. Never parse `getComputedStyle().color`.
4. Cover **every role against every surface it can land on** — canvas, `surface-muted`, and for scoped roles the panel. Include both destructive fill/foreground pairs.
5. Assert the ramp is luminance-monotonic, has 9 distinct hexes, **and that every step round-trips in gamut**. Monotonicity + uniqueness cannot detect a gamut violation — that is how three bad chromas survived draft 2.
6. Assert `--brand-vivid` on the light canvas is **< 3** — documenting that 1.80:1 earns no large-text exemption.
7. Assert the scrollbar thumb clears 3:1 against its track, both themes.

- [ ] **Step 8: `bash scripts/verify.sh`** green. **No commit yet** (see Task 3).

---

### Task 2: Teach the existing harnesses about the role graph

**Must precede Task 3** — both harnesses gate their whole suite on a regex Task 3 breaks.

**Files:** modify `tests/visual/source-contract.spec.ts`, `tests/visual/token-contract.spec.ts`

- [ ] **Step 1: Remove the dual-mode branch from both**

Both contain at line 16 `const CONVERTED = /--background:\s*oklch\(/.test(CSS);`. 3a rewrites
`--background` to `var(--canvas)`, making it `false` — at which point `source-contract`
**skips 7 of its 8 tests** and `token-contract` switches 5 tests to invalid
`hsl(var(--background))` references. Both then report green while testing nothing.

Phase 0 is committed, so the branch is dead. Delete `CONVERTED` and its conditionals, keeping
**all 8 source tests and all 6 token tests** — replace only reference syntax and conditional
titles. Coverage must not drop.

- [ ] **Step 2: Keep the NARROW hsl invariant here**

Assert only `no hsl(var(...)) call sites remain`. Do **not** add `no raw hsl()` yet — the
Phase-0 gamut-boundary literal `hsl(166 100% 50%)` is still present and
`source-contract.spec.ts:31` still asserts it, so the broad assertion would demand that literal
be simultaneously present and absent. It moves to 3g, with the retirement.

- [ ] **Step 3: Prove no test silently vanished**

```bash
npx playwright test source-contract.spec.ts token-contract.spec.ts --reporter=list
```

Count the reported tests; confirm **zero skipped**. A green run with skips is the exact failure
this task exists to prevent.

- [ ] **Step 4: `bash scripts/verify.sh`** green. **No commit yet.**

---

### Task 3: Migrate everything — milestone-checked, ONE commit

Colour cannot be staged against a zero-tolerance pixel baseline without leaving the suite red
between commits. So this is **one commit** — but **not one unverified leap**. Each milestone
ends with its own check. Commit only after 3h.

**Files:** `app/globals.css`, `app/layout.tsx`, `components/**/*.tsx`, `app/**/*.tsx`, `tests/visual/*.spec.ts`

- [ ] **3a — Repoint the base shadcn tokens at roles.** The layer that actually renders.

```css
  --background: var(--canvas);          --foreground: var(--ink);
  --card: var(--canvas);                --card-foreground: var(--ink);
  --popover: var(--canvas);             --popover-foreground: var(--ink);
  --primary: var(--brand-vivid);        --primary-foreground: var(--on-brand);
  --secondary: var(--surface-muted);    --secondary-foreground: var(--ink);
  --muted: var(--surface-muted);        --muted-foreground: var(--ink-muted);
  --accent-bg: var(--surface-muted);    --accent-foreground: var(--ink);
  --border: var(--border-subtle);       --input: var(--border-strong);
  --ring: var(--focus);
  --destructive: var(--destructive-role);
  --destructive-foreground: var(--destructive-role-foreground);
```

`--input` gets `border-strong`, **not** `border-subtle`: `components/ui/button.tsx:15` uses
`border-input` for the outline variant, making it a control boundary held to 3:1 by WCAG 1.4.11.

Also **delete or repoint the stale `--accent`** at `globals.css:63`. 3b repoints
`--color-accent` at `--accent-bg`, leaving `--accent` unreferenced but still declared.
`--radius` is the only other unmapped base declaration and is non-colour.

*Check:* `npx tsc --noEmit` and `npm run build` exit 0.

- [ ] **3b — Fix the orphaned-accent defect.** `--accent` holds the vivid teal while
`--accent-bg` — the correctly muted surface — is referenced by nothing, so `hover:bg-accent`
flashes full-saturation teal on ghost and outline buttons. Point `--color-accent` at
`var(--accent-bg)` and `--color-accent-foreground` at `var(--accent-foreground)`. Retune
`--accent-tint` in place to derive from `--brand-vivid`; do **not** delete it —
`source-contract.spec.ts:77` asserts it exists and `:63` pins the `color-mix(in srgb` count at 17.

*Check:* ghost/outline hover renders a muted surface in a real browser, not saturated teal.

- [ ] **3c — Retire the legacy navy/slate family.** `--navy*`, `--slate*`, `--lightest-slate`,
`--white` have zero Tailwind utility consumers. Check CSS-internal references first:

```bash
grep -nE 'var\(--(navy|slate|lightest-slate|white)' app components
```

Unreferenced → delete the declarations **and** their `token-contract` entries. Referenced →
repoint at ramp steps. *Check:* the grep returns nothing; build green.

- [ ] **3d — Migrate the TSX call sites**, per the inventory. Small text/links →
`text-interactive`; large display text (≥24px, or ≥18.5px bold) → `text-display-accent`;
meaningful icon → `text-interactive`; decorative glyph → `text-brand-vivid`; control boundary →
`border-strong`; decorative separator → `border-subtle`; the 3 raw palette utilities → a ramp
step or role. **No size grants `brand-vivid` a pass on the light canvas** — 1.80:1 fails even
the 3:1 large-text floor.

*Check:* `grep -rn 'text-primary\|border-primary' app components --include='*.tsx'` returns nothing unexpected.

- [ ] **3e — Migrate the authored CSS**, per the table: the three text sites (`:174`, `:260`,
`:388`) → `var(--interactive)`; the two outlines (`:343`, `:352`) → `var(--focus)`; fills,
shadows, tints and gradients → `var(--brand-vivid)`, keeping `in srgb` everywhere. **And fix
the scrollbar**: thumb → `--border-strong` to clear 3:1 against its track.

*Check:* `grep -c 'var(--primary)' app/globals.css` returns 1 — only the `@theme inline` mapping.

- [ ] **3f — Apply the deep panel with its scope.** Choose the surfaces **explicitly** — the
hero's contrasting band and the featured-project cards — and put `.on-panel` on each panel
container. Do not rely on a parent `text-*` utility: it will not override descendants carrying
`text-foreground`, `text-muted-foreground` or `text-interactive`, and light `--interactive` on
the panel is 2.36:1. The `.on-panel` custom properties handle descendants automatically; verify
no descendant hardcodes a colour outside the role system.

*Check:* `contrast-contract`'s panel-scope pairs pass; panel text legible in both themes in a real browser.

- [ ] **3g — Re-measure every hardcoded expectation, flip the theme, retire the literal, regenerate.**

Enumerate **all five** groups this migration invalidates — draft 2 counted only two:

| Location | What |
|---|---|
| `token-contract.spec.ts:45` `EXPECTED` | 46 RGB arrays (light + dark) |
| `token-contract.spec.ts:151` `COMPOSITED` | 5 composited values |
| `token-contract.spec.ts:126` | a further old-primary array `[29, 211, 168]` |
| `token-contract.spec.ts:244` | 4 more generated-utility arrays |
| `source-contract.spec.ts:38` | pinned `var(--primary) N%` counts totalling 16 |

Re-measure with `sample8bit()` over an explicit token list — never hand-compute. Then:

- `app/layout.tsx:95` `defaultTheme="dark"` → `"light"`; `viewport.themeColor` `#ffffff`/`#0a192f` → `#F4F9F7`/`#17342D`.
- Add a **no-stored-theme** test: the screenshots force a theme explicitly, so they cannot prove the default changed.
- Retune `.gradient-text` to role-based stops, keeping `135deg in srgb`, retiring `hsl(166 100% 50%)`. Update `source-contract.spec.ts:31` to assert its **absence**, and add the broad `no raw hsl()` assertion here.
- Gradient-clipped text has `-webkit-text-fill-color: transparent`, so its `color` is meaningless — excluded from text-contrast reasoning by design, not oversight.

**Gate, then regenerate — in this order:**

```bash
npm run build
npx playwright test contrast-contract.spec.ts source-contract.spec.ts token-contract.spec.ts
# only once those three are green:
npx playwright test --update-snapshots
npx playwright test --repeat-each=3
```

**Inspect all six diffs** — three widths × two themes. A defect confined to dark or to 375px is
invisible in the light desktop diff.

- [ ] **3h — Full gates, then the single commit**

```bash
bash scripts/verify.sh   # must exit 0
```

---

### Task 4: Post-retune verification

Verification only. **No commit.**

- [ ] **Step 1:** `npx playwright test contrast-contract.spec.ts --repeat-each=3`

- [ ] **Step 2: No stale colour survives**

```bash
grep -c 'hsl(' app/globals.css                    # expect 0
grep -c 'var(--primary)' app/globals.css          # expect 1
grep -nE '\-\-(navy|slate|accent):' app/globals.css || echo "CLEAN: legacy retired"
grep -rnE '\b(text|bg|border)-(blue|green|slate|gray|zinc)-[0-9]{2,3}\b' app components --include='*.tsx' || echo "CLEAN: no raw palette"
grep -nE '\-\-(background|foreground|card|primary|border|input|ring):\s*oklch\(' app/globals.css \
  && echo "STALE: base token holds a literal" || echo "CLEAN: base tokens derive from roles"
```

- [ ] **Step 3: Use the site in a real browser.** Serve `out/` and drive Chromium at
`~/.cache/ms-playwright/chromium-1194/chrome-linux/chrome`. Confirm by looking: canvas off-white
not white; deep panel legible in **both** themes; ghost/outline buttons hover to a muted
surface; focus rings visible on canvas, muted **and** panel; section numbers and tech badges
legible; scrollbar thumb discernible against its track. Kill the server by recorded PID —
`pkill -f "http.server 809"` kills the agent's own shell.

- [ ] **Step 4:** `git status --porcelain` clean.

---

## What changed in this pass

Each row is a defect an earlier draft actually shipped. Do not "simplify" them back.

| Earlier draft | This pass |
|---|---|
| Ramp steps 500/600/800 authored outside sRGB; caps found by growing chroma until bytes stopped changing | Corrected chromas; caps found by **round-trip**, because out-of-gamut colours are gamut-mapped, not clamped |
| Ramp test asserted monotonicity + 9 distinct hexes | Also asserts every step **round-trips in gamut** — the old test could not detect the violation at all |
| One `--focus` for both themes | Per-theme. Exhaustive sweep found **zero** single values clearing 3:1 on all six surfaces |
| `border-strong` a single value | Per-theme plus `.on-panel`. **No** ramp step clears 3:1 on both the light canvas and the deep panel |
| `panel-foreground` alone would make panels safe | A full **`.on-panel` custom-property scope**: on the panel, light `ink` is 1.14:1 and light `interactive` 2.36:1 |
| `destructive-foreground` light on a dark fill | `--teal-900` in dark — light-on-light was **2.68:1**, and `button.tsx`/`badge.tsx` use exactly that pair |
| Task 1 sampled `--destructive` before defining it | Non-consuming `--destructive-role`, tested in Task 1, wired in 3a |
| `setTheme()` after `goto()` | Before, per `helpers.ts:5`; assert the resulting `html` class |
| Task 2 added `no raw hsl()` while the Phase-0 literal was still required | Narrow `no hsl(var(...))` in Task 2; broad assertion moves to 3g |
| Re-measured only `EXPECTED` + `COMPOSITED` | All **five** groups, including `token-contract:126`, `:244`, and the pinned percentages at `source-contract:38` |
| Scrollbar unclassified | Measured at **1.52:1 / 2.09:1** — a real failure — and fixed to `border-strong` |
| `--accent` left declared but unreferenced | Explicitly deleted or repointed in 3a |
| Inventory counts predated Phase 1a | Re-counted at `d926de5`, with the command to regenerate |
| Task 3 was one 11-step leap | Eight milestones, each independently checked, still one final commit |
