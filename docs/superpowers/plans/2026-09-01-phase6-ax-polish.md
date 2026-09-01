# Phase 6 — AX + polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the agent-experience layer, close every accessibility gap §9 names, fix the
social card, and eliminate the horizontal overflow — per spec §8, §9 and §15 Phase 6.

**Architecture:** Plain static files for the crawl surface, one JSON-LD `@graph` in
`app/layout.tsx`, and a committed OG image. `output: 'export'` is static; nothing may depend on
a runtime.

**Tech Stack:** Next.js 16.3.3 (`output: 'export'`), React 19.2.8, `@playwright/test` 1.62.1.

**Spec:** §8 (AX layer), §9 (a11y gaps + other pre-existing defects), §15 Phase 6.
**Depends on** Phase 4, merged at `2cba2c1`. This is the last phase that needs nothing from Jeril.

---

## Why the crawl surface is plain files, not `app/sitemap.ts`

The idiomatic Next answer **fails the build here.** Verified in the installed source:

- A `.ts` metadata route is compiled to a **GET Route Handler**. `robots.ts` goes through
  `getDynamicTextRouteCode` and `sitemap.ts` through `getSitemapRouteCode`
  (`next-metadata-route-loader.js:300-308`). **Neither emits `dynamic = 'force-static'`** — only
  `getStaticAssetRouteCode`, the branch for a literal static file, does.
- Under `output: 'export'`, a route exporting `GET` without static config **throws E301**
  (`route-modules/app-route/module.js:106`, criteria in `helpers/is-static-gen-enabled.js`).

So `app/sitemap.ts` with only a default export is not "silently skipped" — it breaks `npm run build`.

Two valid fixes exist: add `export const dynamic = "force-static"` to each file, or write plain
files. **This plan uses plain files in `public/`** — for one fixed route on a one-page site, a
route handler buys nothing, carries framework-version risk, and the `new Date()` determinism trap
disappears with it.

`llms.txt` also goes in `public/`. The llms.txt spec puts it at `/llms.txt`. (Note: spec §8 says
`/.well-known/` is unusable on GitHub Pages *project* sites — true, but this is a **user** site
at the origin root, so `/.well-known/` would in fact work. It changes nothing: `/llms.txt` is
where the spec wants it.)

## The metadata audit — verified against the live site

| Finding | Evidence |
|---|---|
| **`og:image` dimensions are a lie** | Declares `800×800`; `public/profile.jpg` is **996×1325** |
| **`twitter:card` is `summary_large_image`** | but the image is a tall portrait, so it centre-crops to a slice |
| **No `canonical`** | zero `canonical`/`alternates`; none served |
| No `sitemap.xml`, `robots.txt`, `llms.txt`, JSON-LD | all four 404 / absent |

Spec §9 agrees and adds the priority: *"For a job-seeking site this is worth more than `llms.txt`."*

**Do not touch** (metadata skill, tool boundaries): `metadataBase`, title, keywords, authors,
creator, `og:type`, `og:locale`, `og:siteName`, and the `robots` block.

---

### Task 1: Fix the social card

**Files:** create `public/og.png`; modify `app/layout.tsx`

- [x] **Step 1: Generate a branded 1200×630 image**

Render with the cached Chromium at
`~/.cache/ms-playwright/chromium-1194/chrome-linux/chrome`, using the site's real tokens and
fonts so the card matches the site: canvas `oklch(0.977 0.006 171)`, ink `oklch(0.26 0.030 171)`,
accent `oklch(0.50 0.0979 171)`, Newsreader for the name, JetBrains Mono for the eyebrow.
Content: name, role, and the two approved G3 claims.

**Screenshot with `scale: "css"`.** A 1200×630 viewport at `deviceScaleFactor: 2` otherwise
writes a **2400×1260** file, and the dimension assertion below would fail on the very artefact
it is meant to guard. Then **assert the written PNG's real header dimensions** — do not trust
the viewport.

- [x] **Step 2: Point both cards at it, with true dimensions**

```ts
  images: [{ url: "/og.png", width: 1200, height: 630, alt: "Jeril Kuriakose — Principal Data Scientist" }],
```

…in `openGraph`, and `images: ["/og.png"]` in `twitter`. `summary_large_image` becomes correct
now the image is finally 1.91:1.

- [x] **Step 3: Add the canonical**

```ts
  alternates: { canonical: "https://jerilkuriakose.github.io" },
```

**Expect a trailing-slash normalisation.** The live site already serves
`og:url` as `https://jerilkuriakose.github.io/` although the source omits the slash. Any test
comparing canonical to `og:url` must normalise before comparing, or it fails on a difference
that is not a defect.

- [x] **Step 4: Reconcile the descriptions — one source string**

The top-level `description` currently differs from the `openGraph` and `twitter` descriptions.
That is a real inconsistency the metadata skill forbids, and it makes "description agrees
everywhere" untestable. Pick the top-level string as canonical and use it in all three. This is
the one description edit this phase makes.

- [x] **Step 5: Gate** — build, tsc, lint clean.

---

### Task 2: The crawl surface — plain static files

**Files:** create `public/sitemap.xml`, `public/robots.txt`, `public/llms.txt`

- [x] **Step 1: `public/sitemap.xml`**

One `<url>`, the site root. Do **not** invent per-section URLs — they are anchors on a single
page, and a validator can catch the lie. Hard-code `<lastmod>` as a fixed ISO date; bump it
deliberately. A generated timestamp would make every build produce a diff.

- [x] **Step 2: `public/robots.txt`** — allow all, and reference the sitemap absolutely
(`Sitemap: https://jerilkuriakose.github.io/sitemap.xml`). Nothing here is private, so a
restrictive default would be wrong.

- [x] **Step 3: `public/llms.txt`**

Spec §8 names "a personal site answering questions about someone's CV" as the use case. Plain
Markdown: name, role, location, the two approved claims, current focus, key skills, publications,
contact.

**Be honest about drift.** A committed text file **cannot** import `DATA`, so do not claim it is
"generated". Task 5 instead asserts its content against `DATA`, which is what actually prevents
drift.

- [x] **Step 4: Verify all three are copied into `out/`**

```bash
npm run build && ls -la out/sitemap.xml out/robots.txt out/llms.txt
```

Files in `public/` are copied verbatim, so this should be unconditional — but assert it, because
`.nojekyll` handling and export copying have surprised this repo before.

---

### Task 3: Structured data

**Files:** modify `app/layout.tsx`

- [x] **Step 1: One `@graph`, built from `DATA`**

Spec §8 asks for `Person` + `ScholarlyArticle`. Use a single `@context` with an `@graph`: one
`Person` node identified `#person`, and separate `ScholarlyArticle` nodes whose `author`
references that `@id`. `@graph` keeps independent articles independent and makes them countable.

`Person`: name, jobTitle, address, `sameAs` (the real social URLs), `knowsAbout` from skills.

- [x] **Step 2: Include `url` on an article ONLY where `DATA` identifies that article**

Checked: of five publications, **only one** carries a publication-specific URL
(`doi.org/10.48550/arXiv.2407.15390`, the ALLaM ICLR paper). The other four all point at the
**same generic Google Scholar profile**. Emitting that as an article `url` would be misleading
structured data — precisely the "do not invent" rule. Omit `url` for those four until real DOIs
exist.

Do not invent ratings, an employer organisation record, or an alumni claim the page does not
render. One `<script type="application/ld+json">`, not several.

- [x] **Step 3: Gate** — build clean; the block parses.

---

### Task 4: Accessibility — every gap §9 names

§9 lists these explicitly. Generic "landmarks and labels" is not enough; an executor needs each one.

**Files:** modify `app/page.tsx`, `app/layout.tsx`, `components/sections/hero.tsx`, `components/sections/contact.tsx`, `components/chrome/social-rail.tsx`, `components/chrome/mobile-dock.tsx`, `components/icons/index.tsx`, section components

- [x] **Step 1: Skip link** — first focusable element in the document, visually hidden until
focused, targeting the main content. `<main>` needs a matching `id` and `tabIndex={-1}`.

- [x] **Step 2: `<header>` landmark** around the hero region.

- [x] **Step 3: Real `<nav>` landmarks** for the social rail and mobile dock. Adding `aria-label`
to a `<div>` does **not** create a navigation landmark — the element must be `<nav>`, each with a
distinct `aria-label` (e.g. "Social links" and "Social links, mobile") so the two are
distinguishable.

- [x] **Step 4: Icon-only links get real accessible names.** WhatsApp and phone in **both**
`hero.tsx` and `contact.tsx` currently rely on `title` alone. Add `aria-label`.

- [x] **Step 5: Custom SVGs** in `components/icons/index.tsx` have neither a name nor
`aria-hidden`. They sit inside links that will now carry `aria-label`, so mark them
`aria-hidden="true"` and let the link name them — one name per control, not two.

- [x] **Step 6: Name every section** via `aria-labelledby` pointing at its existing heading.
Give each heading a stable `id`.

- [x] **Step 7: Eliminate the horizontal overflow**

Measured 38/77/128px at 375/768/1280. Cause: the hero's two decorative blur blobs at
`left-[-10%]`/`right-[-10%]`.

**Add `overflow-hidden` to the blob container specifically** — `hero.tsx:21`, the
`absolute inset-0 pointer-events-none` div. **Do not clip the `<section>`**: the portrait ring,
the "Open to work" badge, the scroll indicator and the fixed rails are siblings or live outside
Hero, and clipping the section would cut them.

Then **tighten `ia-order.spec.ts` to exactly 0 at all three widths and delete the
`KNOWN_OVERFLOW` map.** Leaving the lock in place after fixing it would let the defect return
unnoticed.

- [x] **Step 8: Delete the dead classes §9 assigns to this phase**

`animate-in fade-in-0 zoom-in-95` and the `data-[state=*]` animation variants in
`components/ui/tooltip.tsx:21`, plus `bg-grid-pattern` in `components/sections/featured-project.tsx:33`.
Verified: `bg-grid-pattern` is defined **0 times** in `globals.css` and `tailwindcss-animate` was
never a dependency — these emit no CSS at all. §9 says adopt the plugin or delete; delete.

---

### Task 5: The metadata contract

**Files:** create `tests/visual/metadata-contract.spec.ts`

Assert against **rendered HTML and real HTTP responses** — the point is what a scraper receives.

- [x] **Step 1: Exact relationships, not "consistency"**

"Title, description, canonical and og:url mutually consistent" is not executable — a canonical
cannot equal a title. Assert specifically: `title` **equals** `og:title` and `twitter:title`;
`description` **equals** `og:description` and `twitter:description`; `canonical` and `og:url` are
**URL-equivalent after normalising the trailing slash**.

- [x] **Step 2: Exactly one of each** — no duplicate `title`, `description`, `canonical` or
`robots` tag. The metadata skill's priority-1 rule.

- [x] **Step 3: The social card, checked end to end**

`og:image` must be absolute, and the declared `1200`/`630` must match the **fetched image's**
real dimensions. **Fetch the URL from the rendered tag** rather than reading `public/og.png`
from disk: a disk check passes while the tag points at a different asset.

- [x] **Step 4: Artefacts, with status codes**

`page.goto()` **resolves on a 404**, so assert `response.status() === 200` for
`/sitemap.xml`, `/robots.txt` and `/llms.txt`, check their content types, and assert sentinel
content (the sitemap contains the site URL; `robots.txt` contains the absolute `Sitemap:` line).

- [x] **Step 5: JSON-LD, validated not counted**

Exactly one block; it parses; the `Person` node's `name` matches `DATA.name`; the
`ScholarlyArticle` count matches `DATA.publications.length`; every node has the expected
`@type`; and **no article carries a `url` that is the generic Scholar profile**.

- [x] **Step 6: `llms.txt` agrees with `DATA`** — name, role, both approved metric values, and
the publication count. This is what actually prevents the drift Task 2 could not.

- [x] **Step 7: Mutation-test every category.** Break each one deliberately — wrong declared
dimensions, an og:image pointing elsewhere, a mismatched canonical, a duplicated title tag, a
deleted artefact, a malformed JSON-LD block, an `llms.txt` value changed — and confirm the
matching assertion fails. Five phases running, the decisive defect has been a gate that proved
nothing; a category with no mutation test is not yet trusted.

---

### Task 6: Verify, then ship

- [x] **Step 1:** Gate every contract, inspect all six diffs (expect a change in the hero corners
from the clip, and nothing else), regenerate the baseline, `verify.sh` exits 0.
- [x] **Step 2: One commit**, then push and confirm the deploy.
- [x] **Step 3: Verify on the real URL** — all three artefacts return 200; `og.png` returns 200 and
is 1200×630; canonical present and correct; JSON-LD present.
- [x] **Step 4: Check the card as a scraper sees it** — fetch the deployed HTML and confirm the OG
tags resolve to a live image. The skill is explicit: verify on a real URL, never localhost.
- [x] **Step 5:** `git status --porcelain` clean.

---

## Self-Review

**1. Spec coverage.** §8's ship list in full: semantic HTML and a clean a11y tree (Task 4),
`sitemap`/`robots`/`llms.txt` (Task 2), `Person` + `ScholarlyArticle` (Task 3). §8's *do not
ship* list respected — no `ai-plugin.json`, no OpenAPI spec, no WebMCP. §15's branded 1200×630 OG
image is Task 1. **Every** §9 accessibility gap is a numbered step in Task 4, and §9's dead-class
defects are Step 8. §9's overflow requirement is Step 7.

**2. Placeholder scan.** No TBD. Each trap is called out inside the step that would otherwise
introduce it: the E301 build failure, the `scale: "css"` doubling, the trailing slash, the 404
that `goto` swallows, the disk-vs-fetched image check.

**3. Corrections applied after Oracle review** (verdict `FIX-FIRST`; every finding verified
against the installed Next source, the real components and the deployed HTML):

| Finding | Fix |
|---|---|
| `app/sitemap.ts`/`robots.ts` would **fail the build with E301** — the metadata loader does not add `force-static` for `.ts` routes, and `output: 'export'` rejects an unconfigured `GET` | Task 2 uses plain `public/` files, which also removes the `new Date()` determinism trap |
| Task 4 claimed a clean a11y tree while omitting the `<header>`/`<nav>` landmarks, skip link, title-only WhatsApp/phone links and unnamed SVGs that §9 names explicitly | Task 4 is now eight numbered steps, one per §9 item |
| The metadata contract was not executable: canonical cannot equal title, the three descriptions genuinely differ, `metadataBase` is not in the HTML, and the live `og:url` carries a trailing slash the source omits | Task 5 states exact relationships and normalises; Task 1 Step 4 reconciles the descriptions to one source string |
| Assertions that could pass while broken: `goto` resolves on 404; a disk dimension check passes while the tag points elsewhere; name+count match while `@type` or topology is wrong | Status codes asserted, the **fetched** image inspected, JSON-LD types and graph membership validated, and Step 7 mutation-tests every category including duplicates and missing artefacts |
| Four of five publications share a **generic Scholar profile** URL, so "publications with DOIs" was not achievable in the plural | `url` included only where it identifies the article; `@graph` topology specified |
| `llms.txt` was described as generated from `DATA`, which a committed file cannot be | Claim dropped; Task 5 Step 6 asserts its content against `DATA` instead |
| `deviceScaleFactor: 2` would write a 2400×1260 PNG and fail the dimension assertion | `scale: "css"` specified |
| §9's dead-class defects, assigned to Phase 6, were missing | Task 4 Step 8 |

Oracle also confirmed: the metadata audit findings; that clipping **the blob container** is safe
while clipping the section would not be; that tightening `ia-order` to 0 and deleting
`KNOWN_OVERFLOW` is complete; and that the `ImageResponse` prohibition was overcautious — a
static `opengraph-image` can be prerendered — though a committed PNG remains the better
deterministic choice.

**4. Known risks.** (a) Clipping the blob container changes the rendered gradient at the hero
edges, so a diff there is expected rather than suspicious. (b) `llms.txt` and JSON-LD both restate
CV content, so both are guarded by contract tests rather than good intentions. (c) Task 4 touches
many files for small edits; the a11y assertions in Task 5 are what prove it actually landed.
