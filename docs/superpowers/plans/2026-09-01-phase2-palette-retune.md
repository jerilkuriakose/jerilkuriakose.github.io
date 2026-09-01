# Phase 2 — Palette retune to light-default deep teal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the navy/bright-teal palette with the light-default deep-teal system from
spec §3 — built on a **9-step OKLCH ramp** with **semantic roles** layered over it — and
reclassify every brand-colour usage so nothing illegal ships.

**Architecture:** Three layers, each with one job.
1. **Ramp primitives** `--teal-100..900` — the 9 steps spec §3 requires. Raw colour, no meaning.
2. **Semantic roles** — `ink`, `interactive`, `focus`, `brand-vivid`, … each pointing at a ramp
   step, with a measured contrast floor. Roles carry the meaning.
3. **Base shadcn tokens** — `--background`, `--foreground`, `--border`, … repointed at roles.
   This layer is what the existing components already consume, so it is what actually renders.

Skipping layer 3 was the defect that sank the first draft of this plan: roles nothing
consumes change nothing.

**Tech Stack:** Next.js 16.3.3, React 19.2.8, Tailwind 4.3.3 (`@theme inline`), `@playwright/test` 1.62.1.

**Spec:** implements **Phase 2** of §15 plus the §3 ramp requirement (`### Build a 9-step teal ramp in OKLCH`).

**Depends on:** Phase 1a merged and its baseline regenerated. Tasks 3–4 edit
`components/sections/*` and `components/chrome/*`, which do not exist before then.

## Global Constraints

- Node `>=20.9.0`. Do **not** upgrade ESLint past 9.x.
- Gradients pin `in srgb`; alpha uses `color-mix(in srgb, …)`, never `in oklab`.
- **Every colour measurement reuses `sample8bit()` and `setTheme()` from `tests/visual/helpers.ts`.**
  Never parse `getComputedStyle().color`: it returns `oklch(0.26 0.03 171)` **verbatim**, which
  is exactly why that helper exists (`helpers.ts:74-80`).
- **No contrast number enters this plan or its tests unless a browser produced it.**
- `bash scripts/ensure-browser-deps.sh` before browser work — the libs are ephemeral.

---

## The measured token graph

Every value below was measured in Chromium 141 (`oklch` → 1×1 canvas → WCAG relative
luminance). **Do not substitute computed values.**

### Ramp — `H = 171`, chroma clamped to the sRGB gamut

| Step | OKLCH | Hex | on canvas | on panel |
|---|---|---|---|---|
| `--teal-100` | `oklch(0.977 0.006 171)` | `#F4F9F7` | 1.00 | 12.61 |
| `--teal-200` | `oklch(0.93 0.022 171)` | `#DAEDE6` | 1.15 | 11.01 |
| `--teal-300` | `oklch(0.86 0.070 171)` | `#A2E0CB` | 1.40 | 8.98 |
| `--teal-400` | `oklch(0.773 0.147 171)` | `#1ED3A9` | **1.80** | 6.99 |
| `--teal-500` | `oklch(0.66 0.150 171)` | `#00AF86` | 2.64 | 4.78 |
| `--teal-600` | `oklch(0.55 0.130 171)` | `#008967` | 4.13 | 3.05 |
| `--teal-700` | `oklch(0.44 0.0862 171)` | `#00614C` | 7.01 | 1.80 |
| `--teal-800` | `oklch(0.35 0.070 171)` | `#004636` | 10.23 | 1.23 |
| `--teal-900` | `oklch(0.26 0.030 171)` | `#142922` | 14.41 | 1.14 |

`--teal-700` is **chroma-clamped**: the sRGB gamut cap at `L 0.44, H 171` is `C = 0.0862`.
Requesting more silently gamut-maps, so `0.0862` is the authored value. Caps at other steps
are higher and were not hit.

Two off-ramp values are needed because no ramp step satisfies their two-surface contract:

| Token | OKLCH | Hex | Measured |
|---|---|---|---|
| `--interactive` (light) | `oklch(0.50 0.0979 171)` | `#00755C` | 5.34 canvas · 4.66 on muted |
| `--focus` (both themes) | `oklch(0.60 0.100 171)` | `#319378` | **3.54 canvas · 3.56 panel · 3.09 muted** |
| `--destructive` (light) | `oklch(0.52 0.170 25)` | `#B63132` | 5.68 on canvas |
| `--destructive` (dark) | `oklch(0.70 0.150 25)` | `#ED756E` | 4.71 on panel |

`--focus` exists as its own value precisely because `--interactive` scores only **2.36:1**
against the deep panel and cannot serve as a focus ring there. A rejected candidate is
recorded so it is not retried: `oklch(0.58 0.180 25)` `#CF4040` reaches only **4.43** on
canvas — below the 4.5 floor for `destructive`.

### Roles, per theme — all floors verified

| Role | Light | Dark | Floor | Measured L / D |
|---|---|---|---|---|
| `canvas` | `teal-100` | `panel` | — | — |
| `panel` | `oklch(0.30 0.038 175)` `#17342D` | `teal-900` | — | — |
| `panel-foreground` | `teal-100` | `teal-100` | ≥4.5 | **12.61** / 12.61 |
| `ink` | `teal-900` | `teal-100` | ≥7 | 14.41 / 12.61 |
| `ink-muted` | `oklch(0.50 0.020 171)` `#586762` | `teal-300` | ≥4.5 | 5.59 / 8.98 |
| `brand-vivid` | `teal-400` | `teal-400` | fill only (L) | 1.80 / 6.99 |
| `on-brand` | `teal-900` | `teal-900` | ≥4.5 | 7.99 / 7.99 |
| `interactive` | `#00755C` | `teal-400` | ≥4.5 text | 5.34 / 6.99 |
| `display-accent` | `#00755C` | `teal-400` | ≥3 | 5.34 / 6.99 |
| `border-strong` (controls) | `teal-600` | `teal-600` | ≥3 | 4.13 / 3.05 |
| `border-subtle` (decorative) | `teal-200` | `teal-600` | none | — |
| `focus` | `#319378` | `#319378` | ≥3 both surfaces | 3.54 & 3.56 |
| `destructive` | `#B63132` | `#ED756E` | ≥4.5 | 5.68 / 4.71 |
| muted surface | `teal-200` | `teal-800` | ink ≥4.5 on it | 12.58 / — |

**`brand-vivid` is never text on the light canvas — at any size.** 1.80:1 is below even the
3:1 large-text floor, so there is no size exemption. On dark it is legal as text (6.99:1).

## The full usage inventory

Two surfaces, both of which must be migrated. The first draft of this plan inventoried only
the first and would have shipped WCAG failures.

**TSX utilities:**

| Utility | Count | Disposition |
|---|---|---|
| `text-primary` | 38 | → `text-interactive`, or `text-display-accent` for large display text |
| `bg-primary` / `bg-primary/N` | 15 | legal as fill; text on it → `on-brand` |
| `border-primary/N` | 17 | control boundary → `border-strong`; decorative → `border-subtle` |
| `shadow-primary/N` | 2 | decorative, fine |
| `text-muted-foreground` | 27 | → `ink-muted` via base token |
| `text-foreground` | 21 | → `ink` via base token |
| `border-border` | 17 | → `border-subtle` via base token |
| `bg-card` / `bg-background` | 7 / 4 | → `canvas` via base token |
| `to-blue-500`, `bg-green-500`, `bg-blue-400` | 3 | raw palette, bypasses the token system entirely |

**Authored CSS — invisible to any TSX grep.** `app/globals.css` contains **20**
`var(--primary)` references. Three are *text* colour and become illegal at 1.80:1:

| Location | Rule | Kind |
|---|---|---|
| `globals.css:174` | `.numbered-heading::before` | **text** (the section numbers) — **pseudo-element** |
| `globals.css:260` | `.tech-badge` | **text** |
| `globals.css:388` | `.cursor::after` | **text** — **pseudo-element** |
| `:154 :213 :224 :229 :259 :261 :266 :267 :315 :318` | `color-mix()` fills, shadows, borders | fill/decorative |
| `:203 :283` | gradients | fill |
| `:245 :294` | `background-color` | fill |
| `:343 :352` | `outline: 2px dashed` | **non-text, needs ≥3:1** → `focus` |
| `:16` | `--color-primary: var(--primary)` | the `@theme inline` mapping |

**Two of the three text usages are pseudo-elements.** No TSX grep reaches them, and no DOM
text walker reaches them either — CSS generated content is not in the DOM. They are findable
only by reading the stylesheet, which is why this inventory is enumerated by hand.

---

### Task 1: Build the ramp and the roles

Additive. Nothing consumes them yet, so no pixel moves — which proves the declarations are
well-formed before anything depends on them.

**Files:** modify `app/globals.css`

- [ ] **Step 1: Add the 9 ramp primitives to `:root`**

Theme-independent — a ramp is raw colour, so it is declared once, not per theme.

```css
  /* --- Phase 2: 9-step teal ramp (spec §3). H=171, chroma gamut-clamped.
         Browser-measured; --teal-700 is capped at C=0.0862 by the sRGB gamut. --- */
  --teal-100: oklch(0.977 0.006 171);
  --teal-200: oklch(0.93 0.022 171);
  --teal-300: oklch(0.86 0.070 171);
  --teal-400: oklch(0.773 0.147 171);
  --teal-500: oklch(0.66 0.150 171);
  --teal-600: oklch(0.55 0.130 171);
  --teal-700: oklch(0.44 0.0862 171);
  --teal-800: oklch(0.35 0.070 171);
  --teal-900: oklch(0.26 0.030 171);
```

- [ ] **Step 2: Add the light roles to `:root`**

```css
  --canvas: var(--teal-100);
  --panel: oklch(0.30 0.038 175);
  --panel-foreground: var(--teal-100);
  --ink: var(--teal-900);
  --ink-muted: oklch(0.50 0.020 171);
  --brand-vivid: var(--teal-400);
  --on-brand: var(--teal-900);
  --interactive: oklch(0.50 0.0979 171);
  --display-accent: oklch(0.50 0.0979 171);
  --border-strong: var(--teal-600);
  --border-subtle: var(--teal-200);
  --focus: oklch(0.60 0.100 171);
  --surface-muted: var(--teal-200);
```

- [ ] **Step 3: Add the dark roles to `.dark`**

The ramp does not change; only which steps the roles point at. On dark, `brand-vivid` **is**
legal as text, so `interactive` points at it rather than darkening.

```css
  --canvas: oklch(0.30 0.038 175);
  --panel: var(--teal-900);
  --panel-foreground: var(--teal-100);
  --ink: var(--teal-100);
  --ink-muted: var(--teal-300);
  --brand-vivid: var(--teal-400);
  --on-brand: var(--teal-900);
  --interactive: var(--teal-400);
  --display-accent: var(--teal-400);
  --border-strong: var(--teal-600);
  --border-subtle: var(--teal-600);
  --focus: oklch(0.60 0.100 171);
  --surface-muted: var(--teal-800);
```

- [ ] **Step 4: Expose ramp and roles through `@theme inline`**

```css
  --color-teal-100: var(--teal-100);   /* …through --color-teal-900 */
  --color-canvas: var(--canvas);
  --color-panel: var(--panel);
  --color-panel-foreground: var(--panel-foreground);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-brand-vivid: var(--brand-vivid);
  --color-on-brand: var(--on-brand);
  --color-interactive: var(--interactive);
  --color-display-accent: var(--display-accent);
  --color-border-strong: var(--border-strong);
  --color-border-subtle: var(--border-subtle);
  --color-focus: var(--focus);
  --color-surface-muted: var(--surface-muted);
```

- [ ] **Step 5: Prove nothing rendered changed**

```bash
bash scripts/ensure-browser-deps.sh
npm run build && npx playwright test
```

Expected: **all green, including the 6 screenshots.** Unused tokens must move no pixel.

- [ ] **Step 6: Add the contrast contract**

Create `tests/visual/contrast-contract.spec.ts`. Note it reuses the repo's helpers rather
than re-implementing colour sampling, and that the floor table is **per theme** — a shared
table is what made the first draft unpassable (`ink` on `panel` is 1.14:1 in light).

```ts
import { test, expect } from "@playwright/test";
import { sample8bit, setTheme, type Theme } from "./helpers";

function ratio(a: number[], b: number[]) {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const Y = (p: number[]) =>
    0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]);
  const [hi, lo] = [Math.max(Y(a), Y(b)), Math.min(Y(a), Y(b))];
  return (hi + 0.05) / (lo + 0.05);
}

/** [foreground, background, floor, why] - per theme, because the pairs differ. */
const FLOORS: Record<Theme, Array<[string, string, number, string]>> = {
  light: [
    ["--ink", "--canvas", 7, "body text AAA"],
    ["--ink-muted", "--canvas", 4.5, "secondary text"],
    ["--interactive", "--canvas", 4.5, "links, small text"],
    ["--interactive", "--surface-muted", 4.5, "links on the muted surface"],
    ["--display-accent", "--canvas", 3, "large display text"],
    ["--panel-foreground", "--panel", 4.5, "text on the deep panel"],
    ["--ink", "--surface-muted", 4.5, "text on the muted surface"],
    ["--on-brand", "--brand-vivid", 4.5, "text on a brand fill"],
    ["--border-strong", "--canvas", 3, "control boundaries, WCAG 1.4.11"],
    ["--focus", "--canvas", 3, "focus ring vs canvas"],
    ["--focus", "--panel", 3, "focus ring vs panel"],
    ["--focus", "--surface-muted", 3, "focus ring vs muted"],
    ["--destructive", "--canvas", 4.5, "error text"],
  ],
  dark: [
    ["--ink", "--canvas", 7, "body text AAA"],
    ["--ink-muted", "--canvas", 4.5, "secondary text"],
    ["--interactive", "--canvas", 4.5, "links - brand-vivid is legal on dark"],
    ["--panel-foreground", "--panel", 4.5, "text on the deep panel"],
    ["--on-brand", "--brand-vivid", 4.5, "text on a brand fill"],
    ["--border-strong", "--canvas", 3, "control boundaries"],
    ["--focus", "--canvas", 3, "focus ring"],
    ["--destructive", "--canvas", 4.5, "error text"],
  ],
};

for (const theme of ["light", "dark"] as const) {
  test(`contrast floors hold: ${theme}`, async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await setTheme(page, theme);

    for (const [fg, bg, floor, why] of FLOORS[theme]) {
      const r = ratio(
        await sample8bit(page, `var(${fg})`),
        await sample8bit(page, `var(${bg})`),
      );
      expect(
        r,
        `${theme}: ${fg} on ${bg} (${why}) = ${r.toFixed(2)}:1, need ${floor}`,
      ).toBeGreaterThanOrEqual(floor);
    }
  });
}

test("brand-vivid is illegal as text on the light canvas at ANY size", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await setTheme(page, "light");
  const r = ratio(
    await sample8bit(page, "var(--brand-vivid)"),
    await sample8bit(page, "var(--canvas)"),
  );
  // 1.80:1 - below even the 3:1 large-text floor. This documents WHY there is
  // no size exemption anywhere in this phase.
  expect(r).toBeLessThan(3);
});

test("the ramp is monotonic in luminance and fully in gamut", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const steps = [100, 200, 300, 400, 500, 600, 700, 800, 900];
  const sampled: number[][] = [];
  for (const s of steps) sampled.push(await sample8bit(page, `var(--teal-${s})`));

  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const Y = (p: number[]) =>
    0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]);

  for (let i = 1; i < sampled.length; i++) {
    expect(
      Y(sampled[i]),
      `--teal-${steps[i]} must be darker than --teal-${steps[i - 1]}`,
    ).toBeLessThan(Y(sampled[i - 1]));
  }
  // No two steps may collapse to the same bytes - that would mean the gamut
  // silently mapped two requests onto one colour.
  const hexes = sampled.map((p) => p.join(","));
  expect(new Set(hexes).size, "a ramp step was gamut-clamped onto another").toBe(9);
});
```

- [ ] **Step 7: Run and commit**

```bash
npx playwright test contrast-contract.spec.ts && bash scripts/verify.sh
git add app/globals.css tests/visual/contrast-contract.spec.ts
git commit -m "Add the 9-step teal ramp and the semantic colour roles

Three layers: ramp primitives (--teal-100..900, the 9 steps spec §3 requires),
semantic roles pointing at ramp steps, and per-theme values for each role.
Additive only - nothing consumes them yet, so screenshots are unchanged, which
proves the declarations are well-formed before anything depends on them.

Every value browser-measured, not computed. --teal-700 is authored at C=0.0862
because that is the sRGB gamut cap at L=0.44/H=171; requesting more silently
gamut-maps. --focus exists as its own value because --interactive scores only
2.36:1 against the deep panel and cannot serve as a ring there.

contrast-contract enforces per-theme floor pairs, because the pairs genuinely
differ between themes: ink-on-panel is 12.61:1 in dark and 1.14:1 in light. It
also asserts brand-vivid stays under 3:1 on the light canvas, documenting why
this phase grants no large-text exemption, and that the ramp is monotonic and
no two steps collapse onto the same bytes."
```

---

### Task 2: Teach the existing harnesses about the role graph

**Must precede Task 3.** Both existing contract tests gate their entire suite on a regex
that Task 3 breaks, so doing this later means two tasks run against silently-disabled tests.

**Files:** modify `tests/visual/source-contract.spec.ts`, `tests/visual/token-contract.spec.ts`

- [ ] **Step 1: Replace the conversion sniff in both files**

Both contain, at line 16:

```ts
const CONVERTED = /--background:\s*oklch\(/.test(CSS);
```

Task 3 rewrites `--background` to `var(--canvas)`, so this becomes `false` — at which point
`source-contract` **skips its main suite** and `token-contract` switches to emitting invalid
`hsl(var(--background))` references. Both would go green while testing nothing.

Phase 0 is finished and committed, so the dual-mode branch has no remaining purpose. Delete
it in both files and keep only the post-conversion path, asserting the invariant directly:

```ts
// Phase 0 converted every token to OKLCH; Phase 2 repointed the base tokens at
// semantic roles. Both are committed, so there is no pre-conversion mode left.
test("no raw hsl() survives anywhere in the stylesheet", () => {
  expect(CSS.match(/hsl\(/g)).toBeNull();
});
```

Then remove every `CONVERTED ?` / `if (!CONVERTED)` branch and the now-unused variable.

- [ ] **Step 2: Verify the suites still actually run**

```bash
npx playwright test source-contract.spec.ts token-contract.spec.ts --reporter=list
```

Count the reported tests and confirm none are skipped. A green run with skips is the exact
failure this task exists to prevent.

- [ ] **Step 3: Commit**

```bash
git add tests
git commit -m "Drop the pre-conversion branch from both contract harnesses

Both gated their whole suite on /--background:\s*oklch\(/, which Phase 2 breaks
when --background is repointed at var(--canvas): source-contract would skip its
main suite and token-contract would emit invalid hsl(var(--background))
references, both while reporting green.

Phase 0 is committed, so the dual-mode branch is dead. The OKLCH invariant is
now asserted directly instead of being sniffed."
```

---

### Task 3: Migrate every usage and regenerate the baseline — atomically

**One task, one commit.** Splitting the migration across commits leaves the screenshot suite
red in between, and the first draft of this plan did exactly that while also claiming every
task ends on a full green `verify.sh`. Colour changes cannot be staged incrementally against
a zero-tolerance pixel baseline, so they are not staged at all.

**Files:** modify `app/globals.css`, `components/**/*.tsx`, `app/**/*.tsx`, `tests/visual/token-contract.spec.ts`

- [ ] **Step 1: Repoint the base shadcn tokens at roles**

This is the layer that actually renders. In both `:root` and `.dark`:

```css
  --background: var(--canvas);
  --foreground: var(--ink);
  --card: var(--canvas);
  --card-foreground: var(--ink);
  --popover: var(--canvas);
  --popover-foreground: var(--ink);
  --primary: var(--brand-vivid);
  --primary-foreground: var(--on-brand);
  --secondary: var(--surface-muted);
  --secondary-foreground: var(--ink);
  --muted: var(--surface-muted);
  --muted-foreground: var(--ink-muted);
  --accent-bg: var(--surface-muted);
  --accent-foreground: var(--ink);
  --border: var(--border-subtle);
  --input: var(--border-strong);
  --ring: var(--focus);
  --destructive: oklch(0.52 0.170 25);         /* .dark: oklch(0.70 0.150 25) */
  --destructive-foreground: var(--teal-100);
```

`--input` gets `border-strong`, **not** `border-subtle`: `components/ui/button.tsx:15` uses
`border-input` for the outline variant, making it a control boundary that WCAG 1.4.11 holds to
3:1. `border-subtle` has no floor and is for decorative separators only.

- [ ] **Step 2: Fix the orphaned-accent defect**

`--accent` holds the vivid teal and `--accent-bg` — the correctly-muted surface — is
referenced by nothing, so `hover:bg-accent` flashes full-saturation teal on ghost and outline
buttons. Point Tailwind at the muted token:

```css
  --color-accent: var(--accent-bg);
  --color-accent-foreground: var(--accent-foreground);
```

Retune `--accent-tint` in place to derive from `--brand-vivid`. Do **not** delete it:
`source-contract.spec.ts:77` asserts it exists and `:63` pins the `color-mix(in srgb` count at
exactly 17. Deleting it means editing a passing assertion for no gain.

- [ ] **Step 3: Retire the legacy navy/slate family**

`--navy`, `--navy-light`, `--navy-lighter`, `--slate`, `--slate-light`, `--lightest-slate`,
`--white` have **zero** Tailwind utility consumers. Check for CSS-internal references first:

```bash
grep -nE 'var\(--(navy|slate|lightest-slate|white)' app components
```

Unreferenced → delete the declarations **and** their `token-contract` entries. Still
referenced → repoint at ramp steps. Retiring beats retuning a colour nothing consumes.

- [ ] **Step 4: Migrate the TSX call sites**

```bash
grep -rn 'text-primary\|border-primary\|bg-primary' app components --include='*.tsx'
grep -rnE '\b(text|bg|border|from|via|to)-(blue|green|red|slate|gray|zinc)-[0-9]{2,3}\b' app components --include='*.tsx'
```

Rules, applied per site:

| Case | Becomes |
|---|---|
| Small text or a link | `text-interactive` |
| Large display text (≥24px, or ≥18.5px bold) | `text-display-accent` |
| A meaningful icon | `text-interactive` |
| A purely decorative glyph | `text-brand-vivid` |
| Text sitting on a deep-panel surface | `text-panel-foreground` |
| A control boundary | `border-strong` |
| A decorative separator | `border-subtle` |
| The 3 raw palette utilities (`to-blue-500`, `bg-green-500`, `bg-blue-400`) | a ramp step or role — no raw palette colours survive |

**No size grants brand-vivid a pass on the light canvas** — at 1.80:1 it fails the 3:1
large-text floor too.

- [ ] **Step 5: Migrate the authored CSS — the half a TSX grep cannot see**

`app/globals.css` has 20 `var(--primary)` references. Three are text and become illegal:

- `:174` `.numbered-heading::before` — the section numbers. **Pseudo-element**, so no TSX grep
  and no DOM text walker will ever find it. → `var(--interactive)`.
- `:260` `.tech-badge` — small text. → `var(--interactive)`.
- `:388` `.cursor::after` — small text, **also a pseudo-element**. → `var(--interactive)`.
- `:343` and `:352` `outline: 2px dashed var(--primary)` — non-text, 3:1 floor. → `var(--focus)`.
- Fills, shadows, `color-mix()` tints, gradients (`:154 :203 :213 :224 :229 :245 :259 :261 :266 :267 :283 :294 :315 :318`) — decorative. Repoint at `var(--brand-vivid)`, keeping `in srgb` on every gradient and `color-mix`.

Verify none were missed:

```bash
grep -c 'var(--primary)' app/globals.css   # expect only the @theme inline mapping at :16
```

- [ ] **Step 6: Apply the deep panel to real surfaces**

`--panel` is otherwise an unused definition and the phase would not deliver the deep-panel
system at all. Choose the surfaces deliberately — the hero's contrasting band and/or the
featured-project cards — and pair **every** panel surface with `text-panel-foreground`
(12.61:1). A panel without its foreground is how light-on-light text ships.

- [ ] **Step 7: Re-measure and update `token-contract`**

`token-contract.spec.ts` holds **46** expected RGB arrays plus **5** `COMPOSITED` values
(`--primary` at 10/20/30% and `--border` at 50%, over the real background). Phase 2
invalidates nearly all of them, and the composited ones changed on *both* sides.

Reuse the existing helper rather than the ad-hoc rule-walking the first draft proposed — it
missed tokens nested under grouping rules:

```bash
npm run build
python3 -m http.server 8099 --directory out &   # note the PID; do NOT pkill by pattern
npx playwright test token-contract.spec.ts --reporter=list
```

Read the actual-vs-expected from the failure output, or drive `sample8bit()` over an explicit
token list in a scratch spec. Paste measured arrays in. Never hand-compute.

- [ ] **Step 8: Flip the default theme**

`app/layout.tsx:95`: `defaultTheme="dark"` → `defaultTheme="light"`. Update
`viewport.themeColor` from `#ffffff`/`#0a192f` to `#F4F9F7`/`#17342D`.

Add the assertion that the existing screenshots cannot make, because they force a theme
explicitly and so prove nothing about the default:

```ts
test("a first-time visitor with no stored theme gets light", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
```

- [ ] **Step 9: Retune the gradient and retire the gamut-boundary literal**

`globals.css:203`'s `hsl(166 100% 50%)` survived Phase 0 only because it sits on the sRGB
gamut boundary and could not round-trip. This phase retunes that gradient anyway:

```css
.gradient-text {
  background: linear-gradient(
    135deg in srgb,
    var(--display-accent) 0%,
    var(--brand-vivid) 50%,
    var(--display-accent) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

Update — do not delete — the source-contract assertion that pinned its presence:

```ts
test("the gamut-boundary literal was retired in Phase 2", () => {
  expect(CSS).not.toContain("hsl(166 100% 50%)");
});
```

Gradient-clipped text has `-webkit-text-fill-color: transparent`, so its `color` is
meaningless. It is excluded from text-contrast reasoning by design, not overlooked.

- [ ] **Step 10: Gate, then regenerate the baseline**

All three contracts must pass **before** any snapshot is touched. That ordering is what makes
regeneration evidence rather than rubber-stamping.

```bash
npm run build
npx playwright test contrast-contract.spec.ts source-contract.spec.ts token-contract.spec.ts
```

Only once those are green:

```bash
npx playwright test --update-snapshots
npx playwright test --repeat-each=3
```

**Inspect all six diffs** — three widths × two themes. A defect confined to dark or to 375px
is invisible in the light desktop diff.

- [ ] **Step 11: Full gates and commit**

```bash
bash scripts/verify.sh
git add app components tests
git commit -m "Retune the palette to light-default deep teal

One atomic commit: base tokens repointed at semantic roles, all TSX and
authored-CSS call sites migrated, the deep panel applied with its paired
foreground, defaultTheme flipped to light, and the screenshot baseline
regenerated. Colour cannot be staged incrementally against a zero-tolerance
pixel baseline without leaving the suite red between commits.

The authored CSS mattered as much as the TSX: globals.css carried 20
var(--primary) references, three of them text - including
.numbered-heading::before, a pseudo-element no TSX grep or DOM text walker can
reach. Its section numbers would have shipped at 1.80:1.

--input maps to border-strong, not border-subtle: button.tsx uses border-input
for the outline variant, making it a control boundary held to 3:1 by WCAG
1.4.11. The .gradient-text gamut-boundary literal Phase 0 preserved is retired,
interpolation still pinned in srgb.

Baseline regenerated only after the contrast, source and token contracts passed,
and all six diffs were inspected."
```

---

### Task 4: Post-retune verification

Verification only. **No commit.**

- [ ] **Step 1: Contrast holds, repeatably, both themes**

```bash
npx playwright test contrast-contract.spec.ts --repeat-each=3
```

- [ ] **Step 2: No stale colour survives**

```bash
grep -c 'hsl(' app/globals.css                       # expect 0
grep -c 'var(--primary)' app/globals.css             # expect 1 (the @theme mapping)
grep -rnE '\b(text|bg|border)-(blue|green|slate|gray|zinc)-[0-9]{2,3}\b' \
  app components --include='*.tsx' || echo "CLEAN: no raw palette utilities"
grep -nE '\-\-(background|foreground|card|primary|border|input|ring):\s*oklch\(' \
  app/globals.css && echo "STALE: a base token still holds a literal" \
  || echo "CLEAN: base tokens all derive from roles"
```

- [ ] **Step 3: Use the site in a real browser**

Serve `out/` and drive Chromium at `~/.cache/ms-playwright/chromium-1194/chrome-linux/chrome`.
Confirm by *looking*: the canvas is off-white not white; the deep panel renders with legible
foreground; ghost/outline buttons hover to a muted surface, not saturated teal; focus rings
are visible on canvas, muted **and** panel; the section numbers are legible; dark mode still
reads correctly. Kill the server by recorded PID — `pkill -f "http.server 809"` kills the
agent's own shell.

- [ ] **Step 4: Clean tree**

```bash
git status --porcelain
```

---

## Self-Review

**1. Spec coverage.** Implements §15 Phase 2 and the §3 ramp: the 9-step OKLCH ramp (Task 1
step 1), the full semantic role graph with per-theme values (Task 1 steps 2–3), base tokens
repointed so colour actually changes (Task 3 step 1), every brand usage classified across
**both** TSX and authored CSS (Task 3 steps 4–5), the deep panel applied to real surfaces
(step 6), `defaultTheme` flipped with an assertion that proves it (step 8), and the
`hover:bg-accent` defect fixed (step 2).

**2. Placeholder scan.** No TBD/TODO. Every colour is a browser-measured OKLCH triple with its
rendered hex and its measured ratio. Rejected candidates are recorded with their numbers so
they are not retried.

**3. Type consistency.** `ratio()` is defined once in `contrast-contract.spec.ts`;
`sample8bit()` and `setTheme()` are imported from the existing `helpers.ts` rather than
re-implemented. Role names in Task 1 are the exact names used in Tasks 2–4. `FLOORS` is keyed
by the imported `Theme` type.

**4. Corrections applied after Oracle review** (`reviews/2026-09-01-phase1a-phase2-plans-oracle.md`,
verdict `REDESIGN`). All 13 findings verified true; this file is a rewrite, not a patch:

| Finding | Fix |
|---|---|
| The `FLOORS` table could not pass — one shared table demanded `ink` on `panel` ≥4.5 in both themes, and it is **1.14:1** in light | `FLOORS` is now keyed by theme, and a `panel-foreground` role carries the 12.61:1 pairing the spec actually verified |
| Light `--focus` = `--interactive` scores **2.36:1** on the panel, failing its own two-surface contract | `--focus` is its own measured value, `oklch(0.60 0.100 171)` — 3.54 canvas / 3.56 panel / 3.09 muted |
| The enforcement test was unsound — `getComputedStyle().color` returns `oklch()` verbatim, so its digit-regex yielded `[0, 26, 0]` and matched nothing. **It would have gone green while the site failed WCAG** | Deleted. All sampling goes through the repo's `sample8bit()`, which exists for exactly this reason. Enforcement is now a per-theme floor table over the token graph plus an explicit authored-CSS inventory |
| The inventory missed authored CSS — 20 `var(--primary)` in `globals.css`, three of them text, including a pseudo-element | Task 3 step 5 enumerates all 20 by line and disposition, and Task 3 step 4 covers the 3 raw palette utilities |
| Base-token migration was not decision-complete | Task 3 step 1 gives every mapping; `--surface-muted`, both `--destructive` values and `--destructive-foreground` are measured and specified |
| Repointing `--background` would silently disable **both** harnesses via a `/--background:\s*oklch\(/` sniff | Task 2 removes the dual-mode branch from both **before** anything is repointed, and step 2 verifies no test is skipped |
| The measurement script could not find tokens nested under grouping rules | Replaced with `sample8bit()` over an explicit token list |
| Task order left the suite red across commits while claiming full-`verify.sh` done-ness | The whole migration plus regeneration is now one atomic task and one commit |
| `--input` → `--border-subtle` gave control boundaries a floorless token, contradicting the plan's own 1.4.11 reasoning | `--input` → `--border-strong` (4.13 light / 3.05 dark) |
| The deep panel was never applied and the §3 nine-step ramp was absent | Ramp is Task 1 step 1 with a monotonicity + gamut-collapse test; panel application is Task 3 step 6 |
| Snapshot approval was too weak — omitted `token-contract`, inspected one diff, could not prove the default theme | Task 3 step 10 gates on all three contracts and inspects all six diffs; step 8 adds a no-stored-theme test |
| `RGB` type alias unused | Gone with the rewritten test |
| "eight roles" listed ten tokens; "three cases" presented four | Tables are now the single source of both counts |

**5. Known risk.** Task 3 is large and breaks the baseline deliberately — the second and last
sanctioned regeneration in the redesign. It is atomic because the alternative is worse: a
partial colour migration cannot be green against a zero-tolerance pixel baseline. Mitigation
is that all three contracts must pass before a single snapshot is written.
