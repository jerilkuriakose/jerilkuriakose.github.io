# Oracle review — Phase 6 AX + polish plan

**Date:** 2026-09-01
**Artifact:** `plans/2026-09-01-phase6-ax-polish.md`
**Verdict:** `FIX-FIRST` — 3 blockers, 4 should-fix. **All verified; nothing overridden. All fixed.**

---

## The blocker that would have broken the build

**`app/sitemap.ts` and `app/robots.ts` fail under `output: 'export'`.** Not silently skipped —
the build throws.

Traced through the installed Next 16.3.3 source rather than taken on trust:

- `next-metadata-route-loader.js:300-308` dispatches a `.ts` metadata file by basename:
  `robots` → `getDynamicTextRouteCode`, `sitemap` → `getSitemapRouteCode`. **Neither emits
  `dynamic = 'force-static'`.** Only `getStaticAssetRouteCode` — the branch for a *literal*
  static file — does.
- `route-modules/app-route/module.js:106`: with `nextConfigOutput === 'export'`, a module
  exporting `GET` and failing `isStaticGenEnabled` throws **E301**.
- `helpers/is-static-gen-enabled.js`: passes only on `dynamic = 'force-static'`,
  `dynamic = 'error'`, a `revalidate` value, or `generateStaticParams`.

`createReExportsCode` re-exports the *userland's* named exports, so adding
`export const dynamic = "force-static"` would work. But for one fixed route on a one-page site,
plain `public/` files are simpler, carry no framework-version risk, and remove the `new Date()`
determinism trap as a side effect. Plan switched.

## The other two blockers

| # | Finding | Verification |
|---|---|---|
| B2 | Task 4 claimed a clean a11y tree while omitting most of what §9 names | §9 lists, verbatim: no `<header>`/`<nav>` landmark, no skip link, icon-only WhatsApp/phone links relying on `title` alone, custom SVGs with neither name nor `aria-hidden`. My plan said "landmarks and labels" and named none of them. Also correct that `aria-label` on a `<div>` does not create a navigation landmark |
| B3 | The metadata contract was not executable | A canonical cannot equal a title. The three descriptions genuinely differ (`layout.tsx`), which contradicted my own "do not touch descriptions". `metadataBase` is not in the rendered HTML. And the live site serves `og:url` **with** a trailing slash the source omits, so a naive equality check fails on a non-defect |

B3 also listed four ways my assertions could pass while broken: `page.goto()` resolves on a
**404**; a disk-dimension check passes while the tag points at a different asset; name+count can
match while `@type` or graph topology is wrong; and my three example mutations never exercised the
duplicate-tag or missing-artefact assertions.

## Should-fix, all verified

- **Publications cannot support the promised JSON-LD.** Of five, **only one** has a
  publication-specific URL (`doi.org/10.48550/arXiv.2407.15390`). The other four share the *same
  generic Google Scholar profile*. Emitting that as an article `url` is misleading structured
  data. `url` now appears only where it identifies the work.
- **`llms.txt` cannot be "generated from `DATA`"** — a committed text file cannot import it.
  Claim dropped; a contract test asserts its content against `DATA` instead.
- **`deviceScaleFactor: 2` writes 2400×1260**, not 1200×630, unless `scale: "css"` is set — it
  would have failed the very dimension assertion meant to guard the card.
- **§9's dead-class defects were missing.** `animate-in`/`fade-in-0`/`zoom-in-95` in
  `tooltip.tsx:21` and `bg-grid-pattern` in `featured-project.tsx:33`. Confirmed inert:
  `bg-grid-pattern` is defined **0 times** in `globals.css`, and `tailwindcss-animate` was never
  a dependency. §9 assigns them to this phase.

## What Oracle confirmed

- My metadata audit was right on every point: declared `800×800` vs an actual `996×1325`,
  `summary_large_image` on a portrait, no canonical.
- **Clipping the blob container is safe**; clipping the `<section>` would not be. The portrait
  rings, "Open to work" badge, scroll indicator and fixed rails are siblings or outside Hero.
- Tightening `ia-order.spec.ts` to exactly 0 and deleting `KNOWN_OVERFLOW` is safe and complete.
- The `ImageResponse` prohibition was **overcautious** — a static `opengraph-image` can be
  prerendered — though a committed PNG is still the better deterministic choice.
- This is a **user** site at the origin root, so `/.well-known/` would work; §8's project-site
  limitation does not apply. It changes nothing, since the llms.txt spec wants `/llms.txt`. (I
  had reached the same conclusion independently before the review returned.)

## Pattern, fifth phase running

Again the largest category of finding was **gates that prove nothing** — four separate ways my
metadata assertions could stay green while the thing they check was broken. Every phase so far
has had at least one. Task 5 Step 7 now mutation-tests every category, and explicitly states that
a category without a mutation test is not yet trusted.
