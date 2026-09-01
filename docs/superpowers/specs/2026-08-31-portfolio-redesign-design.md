# Portfolio redesign — design spec

**Date:** 2026-08-31
**Repo:** `jerilkuriakose.github.io`
**Status:** awaiting review by Jeril. Not yet planned, not yet implemented.
**Path taken:** brainstorming → architectural (design decisions delegated to the agent
after Q5; see *Decision log*).

---

## Blocking human gates — canonical state

These are the only things an agent cannot clear itself. **This checkbox list is the
single source of truth for gate state** — `scripts/redesign-status.sh` greps it, so do not
restate gate status anywhere else. Tick a box only when Jeril has actually confirmed it.

- [x] **G1 — Commit decision.** ✅ Resolved 2026-08-31. The upgrade is committed as
      `576c5c3` (framework upgrade) and `e737451` (redesign artifacts). `HEAD` is now the
      upgraded stack, which Phase 0's baseline worktree requires.
- [ ] **G2 — Owner sign-off** on one first-viewport prototype using a *real* final-quality
      image, plus one representative content section. Decisions 7–9 (OKLCH, serif,
      dark-mode policy) were agent-made and are unreviewed by a design-informed human.
      Detail: §2.
- [x] **G3 — Two impact claims** named for the hero and confirmed cleared for public
      attribution. **✅ Resolved 2026-09-01.** Jeril approved two, both explicitly cleared
      for public attribution:
      **`~100,000` man-hours saved / year** (Phoenix, Mizuho Bank) and
      **`~35%` faster model convergence** (curriculum SFT, ALLaM / SDAIA).
      Chosen to be complementary: one business outcome and one technical capability, one
      per employer, so the pair speaks to a non-technical recruiter and a technical
      screener at once. Phase 1b is unblocked. Detail: §5.
- [ ] **G4 — Photography** supplied: 6–10 abstract material macro shots (landscape,
      high-res, cool/neutral). Blocks *shipping* Phase 5, not developing it. Detail: §13.

---

## 1. Goal

Rebuild the look and feel of the single-page portfolio so it actively persuades a
**recruiter or hiring manager** evaluating Jeril for a senior IC / principal /
leadership role in GenAI.

The current site is a competent but recognisable template (the Magic UI / Dillion
portfolio lineage — narrow centred column, blur-fade reveals, social dock). Its
structural problem is not aesthetic: **a recruiter meets "About" and "Skills" before
any evidence of impact.**

### Success criteria

1. A recruiter skimming for 20 seconds can state Jeril's seniority, domain, and at
   least two quantified achievements.
2. The CV PDF is reachable in one click from the first viewport.
3. Visual quality is comparable to the reference (deep-teal frosted-glass editorial),
   without sacrificing skim-ability.
4. All performance and accessibility gates in §9 pass.

### Non-goals

Content rewriting, the LaTeX→HTML/Typst PDF migration, multi-page IA, a blog, and
Radix→Base UI migration are all **out of scope** for this spec. See §12.

---

## 2. Decision log

Decisions **1–6 were made by Jeril** (via structured multiple-choice). Decisions
**7–9 were delegated** to the agent after Jeril said "I don't understand any of these,
do whichever is the best". Delegated decisions carry an explicit sign-off requirement
— see *Owner sign-off gate* below.

| # | Decision | Chosen | By |
|---|---|---|---|
| 1 | Primary audience | Recruiters & hiring managers | Jeril |
| 2 | Visual substrate | Glass over **real photography** | Jeril |
| 3 | Photo sources | Abstract/material macro (substrate) + personal (hero/about) | Jeril |
| 4 | Theme default | **Light**-default, deep teal (matches reference) | Jeril |
| 5 | Scope | Re-skin + resequence + add metric surfaces | Jeril |
| 6 | Composition | **A+C hybrid** — editorial spreads + bento metric tiles | Jeril |
| 7 | Token format | Migrate to **OKLCH** | agent |
| 8 | Display face | Add a **serif** display font | agent |
| 9 | Dark mode | Retained as supported **secondary** theme | agent |

**Owner sign-off gate (blocking).** Decisions 7–9, plus the serif family, the glass
material and the photographic composition, were **not** reviewed by a design-informed
human. Before the implementation plan is finalised, Jeril must approve:

1. one **first-viewport prototype** rendered with a representative final-quality image, and
2. one **representative content section**.

Placeholder-only approval does not satisfy this gate, because photography is the
substrate and real assets determine contrast, crop and hierarchy.

**Dark mode — what "supported secondary" means, precisely.** The existing
`next-themes` toggle is retained and dark mode must not be broken. Binding:

- Dark **must** pass every contrast gate in §9.
- Dark **must** get its own `accent-text` value (the bright teal is legal as text on
  dark, so no darkening is needed there — the opposite of light mode).
- Dark **reuses the same photography bands** with scrim opacity re-tuned per band; it
  does **not** get separate imagery.
- Dark does **not** require its own pixel-diff baseline sign-off beyond the contrast
  and interaction gates.
- `defaultTheme` flips from `"dark"` to `"light"` in `app/layout.tsx`.

**Reference:** the "Herlay" health-brand screens supplied by Jeril — light grey-green
canvas, frosted glass cards over photography, deep-teal panels, two-tone editorial
headlines, pill category labels, ~16–24px radii, soft large-radius shadows, small
in-card data-viz.

**Critical reading of the reference:** most Herlay screens are *plain canvas with
cards*; only some are glass-over-photo. It is a mix, not a glass wall. The design
below reproduces the mix, not the exaggeration.

---

## 3. Colour system

Migrate `app/globals.css` tokens from space-separated HSL channels to **OKLCH**.

**Continuity:** Jeril's existing teal is hue **166** (`--primary: 166 76% 47%` light,
`166 100% 70%` dark). The reference teal is the same family. This is a re-tune of
lightness/chroma on a hue already owned — not a palette replacement.

### Roles

**Hue correction — OKLCH hue is not HSL hue.** Computed conversions of the existing
tokens (sRGB → OKLab, verified 2026-08-31):

| Existing token | OKLCH |
|---|---|
| `--primary` light `hsl(166 76% 47%)` | `oklch(0.773 0.147 170.9)` |
| `--primary` dark `hsl(166 100% 70%)` | `oklch(0.909 0.140 174.9)` |
| `--background` dark `hsl(222 47% 11%)` | `oklch(0.206 0.039 265.5)` |
| `--foreground` dark `hsl(213 14% 80%)` | `oklch(0.840 0.013 253.3)` |

So the accent family is OKLCH hue **≈171**, not 166. The current dark background is
OKLCH hue **265** — genuinely blue, which is why it reads navy rather than teal.
**Target OKLCH hue for the whole teal family: 171 ± 4.**

### Semantic token roles — not just two chromatic buckets

An earlier draft defined only `accent-fill` and `accent-text`. That is insufficient:
a 1.80:1 colour **cannot be authorised for borders**, because WCAG 1.4.11 requires
**3:1** for meaningful non-text elements (control boundaries, focus indicators,
graphical objects). Define these roles instead, each with a measured floor:

| Role | Use | Floor |
|---|---|---|
| `brand-vivid` | decorative fills only; requires a conforming `on-brand` for any text placed on it | none as a fill; paired text ≥4.5:1 |
| `interactive` | links, focus rings, meaningful borders, meaningful icons | ≥3:1 non-text, ≥4.5:1 small text |
| `display-accent` | second line of two-tone headlines | ≥3:1 (WCAG large text) — may reuse `interactive` |
| `on-brand` | text/icons placed on `brand-vivid` | ≥4.5:1 vs `brand-vivid` |
| `ink` / `ink-muted` | primary / secondary body text | ≥7:1 / ≥4.5:1 |
| `border-subtle` | decorative separators only, never a control boundary | none |
| `focus` | focus ring | ≥3:1 vs both adjacent surfaces |
| `destructive` | errors | ≥4.5:1 |

Every role needs a **light and a dark value**. `brand-vivid` is legal as text on dark
(6.97:1 on the deep panel) and illegal as text on light (1.80:1).

### Anchor values

Computed and measured 2026-08-31 via OKLCH → OKLab → linear sRGB → WCAG relative
luminance. Hex is the rendered sRGB result.

| Token role | Anchor | Hex | Measured |
|---|---|---|---|
| Canvas | `oklch(0.977 0.006 171)` | `#F4F9F7` | — |
| `ink` | `oklch(0.26 0.030 171)` | `#142922` | **14.41:1** on canvas |
| Deep panel | `oklch(0.30 0.038 175)` | `#17342D` | canvas-on-panel **12.57:1** |
| `brand-vivid` | `oklch(0.773 0.147 171)` | `#1ED3A9` | 1.80:1 on canvas → **fill only**; **6.97:1** on panel |
| `interactive` (light) | `oklch(0.50 0.0979 171)` | `#00755C` | **5.34:1** on canvas |

`ink` at 14.41:1 is retained. It is green-black on off-white, not pure black on pure
white, so it does not read as harsh — but an `ink-muted` secondary token is required so
hierarchy does not depend on shrinking type.

### Gamut correction

**An earlier draft claimed "all verified in sRGB gamut". That was false.**
`oklch(0.50 0.098 171)` is fractionally **outside** sRGB — its linear red channel is
`−0.0000745`. The true boundary at `L 0.50, H 171` is **`C = 0.097938`**
(independently confirmed to six decimals by review). The original in-gamut check used a
`1e-4` tolerance, which masked it.

**Use `C ≤ 0.0979`.** Browser gamut mapping would render it as ≈`#00755C` regardless,
so the visual consequence is negligible — but a spec must not assert a value is in
gamut when it is not.

Ceiling is tight at this hue: `C ≈ 0.0979` at `L 0.50`, only `≈0.108` by `L 0.55`,
which already fails contrast at 4.30:1. Consequence to accept: `interactive` is
necessarily **less vivid** than `brand-vivid` (C 0.098 vs 0.147). That is a gamut
limit, not a design compromise to be "fixed".

**No third teal.** An earlier draft mentioned a headline accent at "30–34% lightness"
and an `accent-text` at "~26% lightness equivalent" — both stray HSL-lightness
references that contradict the OKLCH values above. All lightness is expressed in OKLCH
`L` only. `display-accent` reuses `interactive` unless a separate measured token is
added.

**Consequences that are binding on implementation:**

1. Today's bright teal may be used for **fills, borders, dark-mode text and
   decoration — never for small text or links on the light canvas.**
2. A separate darker `accent-text` token is **mandatory**, at ~26% lightness
   equivalent, verified ≥ 4.5:1.
3. The **two-tone headline** (§4) uses display sizes, which qualify as WCAG large text
   (≥ 24px, or ≥ 18.5px bold), so the 3:1 floor applies there and ~30–34% lightness is
   acceptable for that use only.
4. This is the single most likely source of an accessibility regression in the
   redesign. Every accent usage must be classified as fill-or-text before it ships.

### Contrast floors (non-negotiable)

- Body text on canvas: **≥ 7:1** (WCAG AAA). Cheap on a light canvas; buys margin.
- **Text over photography: ≥ 4.5:1 measured through the scrim, per image.** Not
  assumed, not inferred from the blur.
- Display type: ≥ 3:1 hard floor, 4.5:1 target.

### Build a 9-step teal ramp in OKLCH

Perceptually even lightness steps, light and dark pairs. Construct with the
`color-expert` skill at implementation time (installed at
`portfolio/.opencode/skills/color-expert`).

### Known migration cost

Every `hsl(var(--x))` call site in the custom CSS below the `@theme` block must be
migrated and re-verified: `.numbered-heading`, `.gradient-text`, `.hero-gradient`,
`.card-hover`, `.glow`, `.animated-underline`, `.tech-badge`, `.timeline-item`,
`.grid-pattern`, `.glass`, focus rings, scrollbar, `::selection`. This is the single
largest regression risk in the spec. Mitigation in §10.

---

## 4. Type system

**Keep:** Inter (body/UI, already loaded, variable) and JetBrains Mono (labels,
metrics, the existing "Hi, my name is" eyebrow — a good pattern worth retaining).

**Add:** one serif display face for headings. Rationale: Inter-bold at 72px is
competent but voiceless, and a serif quietly signals *PhD / publications* while
differentiating from the uniformly-sans dev-portfolio field.

### Display face shortlist — all verified present on Google Fonts 2026-08-31

Verified by `HTTP 200` from `fonts.googleapis.com/css2?family=…`, with Inter and
JetBrains Mono as passing controls:

| Candidate | Note |
|---|---|
| Instrument Serif | Current editorial look; limited weights |
| Newsreader | Variable, screen-oriented, has italics |
| Fraunces | Variable with optical-size axis; warmer, more expressive |
| Source Serif 4 | Soberest option |

**Selection method:** render all four in the real hero at real sizes in headless
Chromium, screenshot, compare. Decide by looking, not by trend claim. (An earlier
attempt to verify which display serifs are used on 2025–26 award-winning personal
sites **failed** — see §11.)

### Rules

- **Every step in the type scale sets its line-height explicitly.** Tailwind 4's
  `leading-*` precedence change already caused one regression in this repo (hero `h1`
  silently grew 72px→90px on upgrade). A new scale is exactly where it recurs.
- Fluid sizing via `clamp()`.
- Two-tone headline treatment: line one ink, line two accent teal. This is the
  highest-leverage single move from the reference.

---

## 5. Information architecture

### Current (9 sections, one route)

hero → About → Skills → Experience → Projects → Publications → Education → Awards → Contact

### New

1. **Hero** — name, one-line positioning, **one compact proof row (2 claims max)**,
   dual CTA (Resume + Contact). Carries the *concise positioning summary* only.
2. **Experience** — opens with the *deeper leadership/context copy* (this is where the
   longer "about" narrative goes), then roles with selected evidence exposed without
   requiring a disclosure click.
3. **Selected work** — project cards framed as outcomes.
4. **Skills** — grouped, scannable.
5. **Publications** — condensed; ICLR 2025 ALLaM paper given prominence.
6. **Education + Awards** — compact, paired.
7. **Contact**

**About is split, deliberately, and the two halves have different names.** An earlier
draft said both "hero absorbs About" *and* "about folded into Experience's intro",
which are contradictory destinations for one block. Resolution: the **positioning
summary** (1–2 lines) lives in the hero; the **leadership context** (longer narrative)
opens Experience. Neither is called "About".

**No separate impact strip.** An earlier draft had both a hero metric row *and* a bento
impact strip, which would render the same scarce numbers twice and burn first-screen
space. The hero proof row is the single metric surface; per-role evidence lives inside
Experience. If a distinct strip is later wanted it must carry *different* evidence than
the hero.

**Rationale:** proof before inventory. Skills is an inventory claim; Experience and
Selected work are evidence. A recruiter needs evidence first.

### Metrics: data model and a blocking content prerequisite

**Blocking prerequisite.** The hero proof row needs *named, approved* claims. This spec
cannot proceed to a locked hero without Jeril:

1. naming the **exact two claims** to feature, and
2. confirming each is **cleared for public attribution** (some SDAIA figures may carry
   confidentiality constraints).

Candidate figures already present in `data/resume.tsx` include 50 TB, ~35%,
~100,000 hours/year and 97% — but *which* to feature, and whether they may be published
prominently, is Jeril's call, not the agent's.

**Data model — no disconnected root-level copy.** Metrics attach to the record they
came from:

- Add a `metrics` array **inside the relevant `work` / `projects` entries**, each with a
  stable `id`, `value`, `label`, and optional `note`.
- Add stable `id` fields to `work` and `projects` entries.
- The hero references **featured metric IDs**, and resolves them from those records.
- **Do not** maintain a second root-level `metrics` array duplicating the values — that
  guarantees drift.

**Container contract:**

- The hero proof row renders correctly at **1 or 2** claims; it is **omitted entirely**
  if none are approved.
- Per-role evidence renders correctly at **0 to N** metrics per role.
- A build-time schema check must fail if a featured metric ID does not resolve.
- **No placeholder or lorem numbers ship.** A missing metric is an absent element.

---

## 6. Glass and photography system

### Photography: outcome constraints, not fixed boundaries

An earlier draft mandated four bands at exact section boundaries. That locked
composition **before the images existed** — and since photography is the substrate,
real crops, tonality, text density and mobile composition materially determine what
works. Replaced with binding outcome rules:

1. **Start with at most two photo-backed regions: hero and contact.** An optional
   portrait inset in Experience may be added only if real assets and the approved
   prototype justify it. More than two requires explicit sign-off.
2. **No photography behind dense content** — never behind lists, tables, the skills
   grid, publications, or the metric row.
3. **The first viewport must remain legible with blur disabled.** Name, role, proof and
   CTA may not depend on `backdrop-filter` to reach contrast.
4. **At most one photo-backed region visible at a time** at any scroll position.
5. Every text-over-photo surface gets a **bounded scrim**, contrast measured per image
   **after** `saturate()` on the final composite.

Sections with **no photography and no `backdrop-filter`**: metric row, Skills,
Publications, Education + Awards.

**Phase 4 is not shippable on placeholders.** It may be *developed* against them, but
shipping requires final assets passing crop, contrast, licensing and performance checks.

**Glass cards appear only where they overlap a photography band.** This is deliberate:
it matches how the reference actually works, keeps most text on solid backgrounds for
skim-ability, and confines blur to bounded regions.

### Hard rules

1. **One `backdrop-filter` layer per visual stack. Never nested.** The CSS Filter
   Effects Level 2 draft specifies that each backdrop filter copies, filters, clips
   and composites the backdrop, and that nesting compounds render/memory bandwidth.
2. **Never blur a large scrolling container.** `soft-skill.md` (bundled in the global
   `frontend` skill) states: *"Apply `backdrop-blur` only to fixed or sticky elements
   … Never apply blur filters to scrolling containers or large content areas — this
   causes continuous GPU repaints and severe mobile frame drops."*
3. **Never animate `backdrop-filter`, `filter`, masks, or blur radius.**
4. Emit both `-webkit-backdrop-filter` and the standard property.
5. `@supports` fallback to an opaque translucent fill when blur is unavailable.
6. Every text-over-photo surface gets a **bounded scrim**; contrast measured per image.

### Glass recipe — opaque by default, translucent only as an enhancement

An earlier draft had this backwards: it put a 20–46% white gradient in the base rule
and called it an "opaque fallback". **It is not opaque** — without `backdrop-filter`,
busy photography shows through sharply and text contrast fails. Correct polarity:

```css
/* DEFAULT: near-opaque, theme-specific. Must pass contrast with NO blur. */
.glass {
  background: var(--glass-solid);          /* light + dark values, ~92-96% opaque */
  border: 1px solid var(--glass-rim);
  border-radius: 20px;
  box-shadow: var(--glass-shadow);
}

/* ENHANCEMENT: only when blur is actually available. */
@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass {
    background: var(--glass-translucent);   /* the 20-46% gradient lives HERE */
    -webkit-backdrop-filter: blur(16px) saturate(125%);
    backdrop-filter: blur(16px) saturate(125%);
  }
}
```

**Light and dark need separate glass tokens** — `--glass-solid`, `--glass-translucent`,
`--glass-rim`, `--glass-shadow`, `--scrim`. A white-based fill washes out on dark; dark
mode is not merely a scrim re-tune of the same material.

`backdrop-filter` is **Baseline 2024** (interoperable since Sept 2024, ~95.7% global).
**Apple "Liquid Glass" has no web CSS equivalent** — it is a native SwiftUI/UIKit
material. No shipping WebKit CSS API for refraction or specular highlights as of
Safari 26.6. Do not chase it.

### Nesting rule — keep the rule, correct the rationale

**Rule stands: one `backdrop-filter` per visual stack, never nested.**

Rationale corrected: Filter Effects Level 2 introduces *backdrop roots* precisely to
**bound** what a nested filter can see. The spec's discussion of exponential cost
describes the unconstrained model that backdrop roots exist to prevent — it is not a
guaranteed cost in shipping browsers. The real reasons to avoid nesting are additional
compositing passes and unintuitive, cross-browser-variable results.

---

## 7. Motion

Retain the existing `BlurFade` component and `motion` (v13, imported from
`motion/react`).

### Two real bugs in the retained component

An earlier draft said "retain `BlurFade`" *and* "never animate filter" — a direct
contradiction, because `BlurFade` animates exactly that. Both bugs must be fixed:

1. **It animates `filter`.** `components/magicui/blur-fade.tsx:36-37` goes
   `blur(6px) → blur(0px)`. Change the default effect to **opacity + translate only**;
   remove filter animation. `BlurFadeText` animates 8px of blur *per character*,
   creating many paint-heavy layers — do not adopt it; delete it.
2. **It never returns to its natural position.** The visible variant ends at
   `y: -yOffset`, not `y: 0` (line 37), so every wrapped element settles **6px above**
   where it belongs. This was independently confirmed in-browser: settled elements carry
   `matrix(1, 0, 0, 1, 0, -6)`. Fix to `y: 0`.
3. **`inView` defaults to `false`** and `app/page.tsx` never sets it, so entrance
   animations fire on load instead of on scroll. Set `inView`. **Setting `inView`
   without fixing 1 and 2 is not sufficient.**

The component *interface* may be retained; its default effect must change.

### Reduced motion

`prefers-reduced-motion` is absent entirely. Specify the reduced outcome **per
interaction**, not merely "add the query": entrance reveals become instant (no
translate, no fade), the scroll-indicator loop stops, disclosure height animation
becomes instant, and the dock magnification is disabled.

### Rules

Animate `transform` and `opacity` only. Never animate `backdrop-filter`, `filter`,
masks, or blur radius. Motion at narrative moments only — never uniform decoration on
every element.

---

## 8. Agent Experience (AX) layer — cheap 80% only

Chrome ships a Lighthouse **Agentic Browsing** category auditing `llms.txt`,
agent-centric accessibility, CLS, and WebMCP. It is **experimental**, requires Chrome
150+, has **no 0–100 score**, and a missing `llms.txt` is scored **N/A, not a
failure**.

Ship: semantic HTML, a clean accessibility tree, `sitemap.ts`, `robots.ts`,
`llms.txt`, and `Person` + `ScholarlyArticle` JSON-LD.

**Do not** ship `ai-plugin.json`, an OpenAPI spec, or a WebMCP integration. A
practitioner who built the full stack judged it premature, noting well-structured
semantic HTML delivers ~80% of the benefit at ~10% of the cost. That matches the
Chrome evidence.

`llms.txt` is at v2 (modified 2026-08-10) and names "a personal site answering
questions about someone's CV" as a use case. Note `/.well-known/` is unusable on
GitHub Pages project sites.

---

## 9. Performance and accessibility gates

Definition of done. **Accessibility, responsive behaviour and lab performance are
cross-cutting acceptance criteria for EVERY phase — they are not a final phase.**
Palette, type, IA, media and motion each create a11y and perf consequences; deferring
them guarantees rework.

### Laboratory gates — verifiable locally / in CI, every phase

| Gate | Target |
|---|---|
| `npm run build` | exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | silent |
| Body contrast | ≥ 7:1 |
| Non-text / borders / focus | ≥ 3:1 (WCAG 1.4.11) |
| Text over photo | ≥ 4.5:1, measured per image on the final composite |
| Horizontal overflow @ 375/768/1280 | **none** — ✅ achieved in Phase 6 |
| Reduced motion | honoured, per-interaction |
| Keyboard traversal + focus visibility | passes |
| Lighthouse (Playwright Chromium, median of 3) | recorded, no regression |

### Field objectives — post-deploy, not lab-confirmable

**Core Web Vitals are field metrics at the 75th percentile.** A local browser run cannot
"confirm" them, and a low-traffic personal site may never accumulate public CrUX data.
State them as objectives, not gates: **LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1**, evaluated
if and when sufficient RUM/CrUX data exists.

### Image delivery — format alone is insufficient

`images.unoptimized: true` is forced by static export, so Next will **not** generate
responsive variants. Specifying "serve AVIF/WebP" does not stop a desktop-sized hero
being downloaded on mobile. Required:

- An **asset manifest**: source, decorative-vs-meaningful, focal point, responsive
  widths, formats, intrinsic dimensions, byte budget.
- Pre-generated responsive variants at build or commit time.
- Delivery via `<picture>` / `image-set()`, or a correctly prioritised `<img>`.
- The hero LCP image must be **early-discoverable and never lazy-loaded**. A CSS
  `background-image` has weaker LCP discoverability — prefer a real element for it.
- Reserve dimensions via `width`/`height` or `aspect-ratio`.

### Social share asset

Current metadata advertises `/profile.jpg` as **800×800** while the file is **996×1325**,
used for a `summary_large_image` card — it will crop badly when a recruiter shares the
site. Add a static branded **1200×630** OG image with name, role and a restrained
portrait treatment, and declare its true dimensions. For a job-seeking site this is
worth more than `llms.txt`.

### Accessibility gaps to close — ✅ ALL CLOSED

- `aria-expanded`/`aria-controls` on the experience disclosure — **Phase 1a** (`d926de5`)
- `<header>` landmark, skip link, real `<nav>` elements, `aria-label` on icon-only
  WhatsApp/phone links, `aria-hidden` on custom SVGs, and every section named via
  `aria-labelledby` — **Phase 6**
- All asserted by `tests/visual/metadata-contract.spec.ts`, which also verifies the skip link
  is genuinely the first focusable element and that no `aria-labelledby` dangles.

### Other pre-existing defects to close

Verified against a pre-upgrade baseline worktree — these are not regressions from this
work, and should not be reported as new breakage.

- ~~**Dead classes emit no CSS:** `animate-in`, `fade-in-0`, `bg-grid-pattern`.~~
  ✅ **Deleted in Phase 6.** Confirmed inert first: `bg-grid-pattern` was defined 0 times in
  `globals.css` and `tailwindcss-animate` was never a dependency. A contract test now fails if
  either returns.
- **PDF prefetch 404:** `next/link` pointing at `/Jeril_Kuriakose_CV.pdf` makes Next
  prefetch an RSC payload that 404s. The file itself serves 200. Use a plain `<a>`.
  → Phase 6.

---

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| OKLCH migration breaks custom CSS call sites (§3) | Migrate in one commit, then pixel-diff against a baseline worktree at every breakpoint. Recipe in workspace `AGENTS.md` §4. |
| Photography assets unavailable (Jeril-supplied) | Build the entire system against placeholders; swap real images in. **Assets never block design.** |
| Impact strip has too few real numbers | Containers must render correctly with 2 tiles, not just 4. No empty-state holes. |
| Light-mode text over photography fails contrast | Bounded scrim per band + measured per image. If an image cannot reach 4.5:1, the image is rejected, not the floor. |
| Mobile blur jank | Blur confined to bounded regions; profile on real hardware, not just headless. |
| `leading-*` regression recurs | Every type-scale step sets line-height explicitly. |

---

## 11. Explicitly unverified

Recorded so future work does not treat these as settled:

- **Whether bento grids, neo-brutalism, oversized type, grain, magnetic cursors or
  terminal aesthetics are "rising" or "dated" in 2026.** No credible dated source
  found. All such claims encountered were unsourced listicles.
- **Which display serifs 2025–26 award-winning personal sites actually use.** Could
  not verify. Only mono-as-display was confirmed (IBM Plex Mono, Fragment Mono).
- **That dark-mode-first is standard for developer/researcher portfolios.** Not
  quantifiable from available sources.
- **ATS behaviour** re: columns, ligatures, tables, headers/footers. No vendor
  documentation from Workday, Greenhouse, Lever, Taleo, iCIMS or Ashby supports the
  common claims. Treat as folklore. Relevant only to the out-of-scope PDF work.

---

## 12. Out of scope

- Content/copy rewriting (including the 30 unquantified bullets) — Jeril's, and a
  separate project.
- LaTeX → Typst/Puppeteer PDF migration. Note **no LaTeX toolchain is installed** in
  this environment, so the current PDF cannot be rebuilt here.
- Multi-page IA, blog, per-paper landing pages.
- Radix → Base UI migration (`migrate-radix-to-base` skill is installed if wanted).
- **Arabic / RTL localisation — explicit non-goal.** Jeril builds Arabic LLMs and is
  based in Riyadh, but the content and the hiring audience are English-language, and
  building Arabic models does not imply he wants to *present himself* in Arabic.
  Unaudited machine translation would be worse than none. **However:** use CSS logical
  properties (`margin-inline`, `padding-inline`, `inset-inline`) and avoid
  direction-dependent component assumptions, so future localisation is not blocked.
  Revisit only if Jeril supplies approved Arabic copy and names Arabic-speaking
  recruiters as an audience.
- **Browser print styles — non-goal.** The PDF is the primary printable artifact and is
  already surfaced in the first viewport.
- **Contact form — non-goal.** Under static hosting it would require a third-party
  service, spam handling and failure states. Existing `mailto:`, phone, WhatsApp and
  LinkedIn paths are sufficient.
- **Analytics — optional, not a prerequisite.** The behavioural success criterion in §1
  cannot be proven by visual QA alone, so a lightweight privacy-respecting page-view /
  CTA-event measurement is worth adding *after* launch if Jeril wants evidence. It must
  not gate the redesign.
- **Error states.** Beyond a branded 404 and graceful image fallback there are no
  meaningful application error states to design.
- `hover:bg-accent` rendering full-saturation teal. Pre-existing: `--accent` holds the
  teal while `--accent-bg` is wired to nothing. **This is IN SCOPE** — it lives in the
  exact token block being rewritten in §3, and the §3 semantic token graph resolves
  it. Listed here only so it is not mistaken for pre-existing breakage during review.

---

## 13. Assets required from Jeril

| Asset | Qty | Spec |
|---|---|---|
| Portrait | 1–2 | Current `profile.jpg` is 996×1325. A wider/higher-res option gives more crop latitude. |
| Abstract material macro | 6–10 | Light through glass, brushed metal, paper, ink, water, fabric. Landscape, high-res, cool/neutral tone so they do not fight hue 166. |
| Workspace / Riyadh | optional | For the about band. |

---

## 14. Verification plan

### Visual regression — scope the old baseline correctly

**Comparing against the *old* site is only a valid gate for Phase 0.** In every later
phase a large pixel difference is *intended* and says nothing about correctness. An
earlier draft applied full-page old-vs-new diffing across all phases; that was wrong.

- **Phase 0 only:** diff against the pre-migration baseline worktree. Nothing is
  supposed to change, so this proves call-site correctness.
- **Phase 1 onward:** diff against the **approved snapshot of the previous phase**, and
  against the design reference. Once a phase is approved, its output becomes the new
  regression baseline.
- Widths **375 / 768 / 1280**, light **and** dark. Dark needs visual sign-off even
  though it needs no fidelity to the old design.
- Before diffing: freeze animation, wait for fonts and images to settle, hold browser
  version and theme constant, move the pointer off interactive elements, and force
  `*{filter:none}` — headless SwiftShader renders large blurs as yellow concentric ring
  artifacts, which is a rasterisation artifact, not a CSS bug.
- Threshold is a **small numeric changed-pixel budget**, not "≈0%".

### Browser acceptance coverage

There are currently **zero tests**. The risky behaviours are data cardinality, semantics
and responsive/contrast behaviour — not isolated functions. Cover:

- Hero proof row with **0, 1, 2** approved claims; per-role metrics at **0..N**
- Resume / mail / phone / external links all resolve
- Disclosure keyboard operation and `aria-expanded` state
- Light, dark, and reduced-motion modes
- No horizontal overflow at 375 / 768 / 1280
- Build-time schema check: every featured metric ID resolves; no placeholder claims ship
- Contrast manifest: every text-over-photo surface against every final image

### Other

Measured contrast report; real-browser interaction pass; eliminate the horizontal overflow.

**Horizontal overflow — measured precisely 2026-09-01, and it is not mobile-only.**
An earlier note here called it "the 39px mobile overflow". It is in fact present at every
width and scales with the viewport:

| Viewport | `scrollWidth − clientWidth` |
|---|---|
| 375 | **38px** |
| 768 | **77px** |
| 1280 | **128px** |

Cause: the hero's two decorative blur blobs are positioned at `left-[-10%]` and
`right-[-10%]` inside an `absolute inset-0` container that has no `overflow-hidden`, so the
bleed is 10% of the viewport on the right edge. Confirmed **pre-existing** — identical values
measured at commit `4a6994f` via a clean `git worktree` build, before the Phase 1a
decomposition. `tests/visual/ia-order.spec.ts` now locks these values so the defect cannot
grow silently; tighten the assertion to 0 in whichever phase clips the container.

---

## 15. Phasing

**Seven numbered phases (0–6):** one mechanical checkpoint (Phase 0) plus six product
phases (1–6). **Accessibility, responsive behaviour and lab performance gate every one**
(§9) — they are never deferred. Each phase must be independently shippable.

### Phase 0 — mechanical OKLCH conversion (a checkpoint, not a product phase)

Convert every token and `hsl(var(--x))` call site to OKLCH at visually-equivalent
values, using enough precision to preserve the rendered 8-bit colours. Do **not** retune
the palette here.

Value: because nothing should change visually, a tight pixel-diff proves call-site
correctness before any design change can mask a mistake in it. Tailwind 4's
`color-mix(in oklab, …)` opacity modifiers do **not** prevent equivalence when the input
colour is equivalent — but OKLCH rounding, gamut mapping, anti-aliasing and unsettled
paint can, hence the numeric budget rather than "≈0%".

Keep this small — a checkpoint/commit, not a phase with its own release.

Touches: `.numbered-heading`, `.gradient-text`, `.hero-gradient`, `.card-hover`,
`.glow`, `.animated-underline`, `.tech-badge`, `.timeline-item`, `.grid-pattern`,
`.glass`, focus rings, scrollbar, `::selection`.

### Phase 1 — evidence model + IA + component decomposition ← *most valuable*

**Split, because an earlier draft of this spec said Phase 1 "requires the §5 content
prerequisite satisfied first" while §5's own container contract says the proof row is
"omitted entirely if none are approved". Those contradicted. The contract wins: the
containers ship empty, so only the content half is gated.**

#### Phase 1a — unblocked, needs nothing from Jeril

- **Decompose `app/page.tsx`.** 794 lines, currently one Client Component, containing
  only **2 `useState`** and **6 `motion.*`** uses across 9 sections. Split into section
  components with client leaves only where state or motion is genuinely needed —
  the experience disclosure, theme toggle, dock, and the BlurFade wrappers. Everything
  else becomes a Server Component. This cuts hydration cost and makes every later phase
  easier to work in.
- **Resequence to §5**: hero → Experience → Selected work → Skills → Publications →
  Education + Awards → Contact.
- **Split About**: positioning summary into the hero, leadership context opens Experience.
  Neither is called "About".
- **Add the schema**: `id` fields plus nested `metrics` arrays on `work` / `projects`
  entries, and the build-time check that a featured metric ID resolves. Schema only — no
  values.
- **Build the containers**: hero proof row and per-role evidence, both rendering nothing
  when empty, per the §5 container contract.

#### Phase 1b — gated on G3

Populate the two approved featured claims and switch the hero proof row on. Small, and
purely content.

### Phase 2 — palette retune

Apply §3: off-white canvas, deep-teal panels, the full **semantic token graph** (not two
buckets), flip `defaultTheme` to `"light"`, fix `hover:bg-accent`. Classify **every**
brand-colour usage as fill / text / non-text and verify against its floor.

### Phase 3 — type system

Serif display selected empirically per §4, explicit line-height at every step, fluid
`clamp()`, two-tone headline. Register the font under its own provider variable (e.g.
`--font-newsreader`) and map `--font-display` to it — never let `next/font` claim a
Tailwind-generated variable name.

### Phase 4 — motion correctness

Fix `BlurFade`'s filter animation and the `y: -yOffset` end state, set `inView`, delete
`BlurFadeText`, implement per-interaction reduced-motion.

### Phase 5 — photography + glass

Hero and contact regions per §6 outcome rules, opaque-by-default glass with the
translucent enhancement, per-image scrims and measured contrast, asset manifest and
responsive variants. **Developed on placeholders; not shippable until final assets pass.**

### Phase 6 — AX + polish

`sitemap.ts`, `robots.ts`, `llms.txt`, JSON-LD, branded 1200×630 OG image, remaining
a11y landmarks and labels.

### Ordering constraints

- Phase 0 strictly first.
- Phase 1 before 2/3 — structure before cosmetics.
- Phase 5 depends on Phase 2 (scrims need final tokens).
- Phase 4 may run any time after Phase 1.
- Phase 6 last, but its a11y items are already gated per-phase by §9.
