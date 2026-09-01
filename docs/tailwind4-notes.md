# Tailwind 4 notes for this repo

Behavioural traps discovered while upgrading from Tailwind 3.4 to 4.3. These are not
enforced by tests, which is why they are written down — everything that *can* be
asserted lives in `tests/visual/source-contract.spec.ts` instead.

---

## `next/font` must not claim `--font-sans` / `--font-mono`

Tailwind 4 uses `--font-sans` and `--font-mono` to **generate** the `font-sans` and
`font-mono` utilities. If `next/font` also registers those variable names you get a
self-referential loop and silently broken typography — no error, just fallback fonts.

`app/layout.tsx` therefore registers:

| Font | Variable |
|---|---|
| `Inter` | `--font-inter` |
| `JetBrains_Mono` | `--font-jetbrains-mono` |

and `@theme inline` maps `--font-sans: var(--font-inter), …`.

**Custom CSS must reference `var(--font-jetbrains-mono)`, never `var(--font-mono)`.**

## `text-{size}` vs `leading-*` precedence reversed

Tailwind 3 let a `text-4xl`-style utility's **bundled** line-height win over a separate
`leading-*` class. **Tailwind 4 reverses this** — the explicit `leading-*` wins.

This silently made the hero headings 25% taller on upgrade: the `h1` went from 72px to
90px line-height, and because it is vertically centred the whole hero shifted.

Fix applied: `leading-tight` was **removed** from the hero `h1` and `h2`, so each
`text-*` breakpoint supplies its own line-height, matching v3 exactly.

**Do not re-add `leading-tight` to those two elements.** If you pair `leading-*` with a
`text-{size}` anywhere, verify the rendered line-height in a browser.

## Colour token architecture

Tokens hold complete `oklch(...)` values and are consumed bare as `var(--x)`. Three
rules govern them, and all three are **asserted** by
`tests/visual/source-contract.spec.ts` — read that file for the reasoning:

1. Derive OKLCH coordinates from the browser (`oklch(from hsl(...) l c h)`), never from
   a conversion library. Older Oklab matrices give subtly different values that opaque
   8-bit sampling cannot detect.
2. Every gradient pins `in srgb`. A non-legacy stop otherwise flips interpolation to
   Oklab and shifts the ramp middle by up to 30/255.
3. Alpha uses `color-mix(in srgb, …)`, never `in oklab`.

`app/globals.css:203` keeps a hard-coded `hsl(166 100% 50%)` deliberately: it sits on
the sRGB gamut boundary and cannot round-trip through OKLCH at any precision. Phase 2's
palette retune replaces that gradient.
