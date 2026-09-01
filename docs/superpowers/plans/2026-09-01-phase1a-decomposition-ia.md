# Phase 1a — Decomposition, IA resequence, evidence schema — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the 794-line `app/page.tsx` Client Component into section components with client leaves only where interactivity genuinely requires them, resequence the page for a recruiter skim, split "About", and add the metrics schema plus empty evidence containers.

**Architecture:** `app/page.tsx` becomes a Server Component that composes section components from `components/sections/`. This phase extracts **four new client leaf files** — `experience-card.tsx`, `social-rail.tsx`, `scroll-indicator.tsx`, `mobile-dock.tsx` — which are the only *page-level* pieces that genuinely need the client. They join the client modules that already exist and stay client (`BlurFade`, `ThemeToggle`, `Dock`, the Radix tooltip primitives); "four" counts the files this phase creates, not the whole client module graph. Everything else renders on the server. The metrics schema and containers ship *empty* — the §5 container contract permits it, so no content approval is required.

**Tech Stack:** Next.js 16.3.3 (App Router, static export), React 19.2.8, Tailwind 4.3.3, `motion` 13.1.1, `@playwright/test` 1.62.1.

**Spec:** `docs/superpowers/specs/2026-08-31-portfolio-redesign-design.md` — implements **Phase 1a** of §15 only. Phase 1b (populating the two claims) is gated on **G3** and is not in this plan.

## Global Constraints

- Node `>=20.9.0`. Do **not** upgrade ESLint past 9.x (`eslint-plugin-react` inside `eslint-config-next@16.3.3` calls a removed ESLint 10 API).
- `output: 'export'` — no server-only runtime features. `images.unoptimized: true`.
- Tailwind theme lives in `app/globals.css` `@theme inline`. Never pair `leading-*` with a `text-{size}` without checking the rendered line-height (Tailwind 4 reversed v3 precedence).
- Colour tokens are OKLCH; rules asserted by `tests/visual/source-contract.spec.ts`. **This phase changes no colour** — `npm run test:visual` must stay green throughout except where the plan explicitly regenerates snapshots.
- Definition of done for every task: `bash scripts/verify.sh` exits 0.
- Chromium libs are ephemeral: `bash scripts/ensure-browser-deps.sh` before browser work.

---

## Three hazards this plan must not trip

Read these before writing any code. Each is a real property of this codebase.

### 1. `DATA.contact.social[].icon` is a React component, and components cannot cross the server→client boundary as props

`data/resume.tsx` stores `icon` as a component reference from `@/components/icons`. Passing one from a Server Component into a Client Component as a prop **fails at runtime** — functions are not serialisable.

**Rule:** any component that renders `social.icon` must import `DATA` **itself** and be a Client Component. That applies to the left social rail and the mobile dock. Do not "lift" the social array into a server parent and pass it down.

### 2. `BlurFade` is a Client Component but may receive server-rendered children

`<BlurFade>{...}</BlurFade>` works from a Server Component: the children are server-rendered and passed through. So wrapping does **not** force a section to be client. Only a section that itself needs state, effects, or event handlers must be client.

### 3. Section numbers are positional, and one is hardcoded wrong already

`.numbered-heading::before` in `app/globals.css` uses `counter-increment: section 1`, so numbers are assigned by DOM order. **Resequencing renumbers every heading.** Separately, `app/page.tsx:688` hardcodes `05. What's Next?` in the Contact section, which is already inconsistent (Contact is the 8th section) and will be more so after resequencing.

**Rule:** delete the hardcoded `05.` and let the counter own all numbering.

---

## File Structure

| File | Responsibility |
|---|---|
| `app/page.tsx` | **rewrite** — Server Component; composes sections in the new order. No `"use client"`. |
| `components/sections/hero.tsx` | **create** — hero; server. Renders `HeroProofRow`. |
| `components/sections/hero-proof-row.tsx` | **create** — server; renders featured metrics, or `null` when none |
| `components/sections/experience.tsx` | **create** — server wrapper; maps `DATA.work` to `ExperienceCard` |
| `components/sections/experience-card.tsx` | **create** — **client**; the disclosure (`useState` + 2 `motion.div`) |
| `components/sections/selected-work.tsx` | **create** — server; featured + other projects |
| `components/sections/featured-project.tsx` | **create** — server; moved verbatim from `page.tsx:36-100` |
| `components/sections/skills.tsx` | **create** — server |
| `components/sections/publications.tsx` | **create** — server |
| `components/sections/education-awards.tsx` | **create** — server; the two paired |
| `components/sections/contact.tsx` | **create** — server |
| `components/chrome/social-rail.tsx` | **create** — **client**; imports `DATA` itself (hazard 1) |
| `components/chrome/email-rail.tsx` | **create** — server |
| `components/chrome/scroll-indicator.tsx` | **create** — **client**; infinite `motion` loop |
| `components/chrome/mobile-dock.tsx` | **create** — **client**; imports `DATA` itself (hazard 1) |
| `components/chrome/site-footer.tsx` | **create** — server |
| `data/resume.tsx` | **modify** — add `id` to `work`/`projects`, add optional `metrics`, add `featuredMetricIds` |
| `data/metrics.ts` | **create** — the `Metric` type and the `resolveFeaturedMetrics` helper |
| `tests/visual/evidence-schema.spec.ts` | **create** — build-time-ish schema assertions |
| `tests/visual/ia-order.spec.ts` | **create** — asserts the rendered section order |

---

### Task 1: Evidence schema and resolver (no content)

**Files:**
- Create: `data/metrics.ts`
- Modify: `data/resume.tsx`
- Create: `tests/visual/evidence-schema.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `type Metric = { id: string; value: string; label: string; note?: string }`; `resolveFeaturedMetrics(data): Metric[]`. `DATA.work[n].id: string`, `DATA.work[n].metrics?: Metric[]`, `DATA.projects[n].id: string`, `DATA.projects[n].metrics?: Metric[]`, `DATA.featuredMetricIds: string[]`.

- [x] **Step 1: Write the failing schema test**

Create `tests/visual/evidence-schema.spec.ts`:

```ts
import { test, expect } from "@playwright/test";
import { DATA } from "../../data/resume";
import { resolveFeaturedMetrics } from "../../data/metrics";

test("every work and project entry has a unique id", () => {
  const ids = [
    ...DATA.work.map((w) => w.id),
    ...DATA.projects.map((p) => p.id),
  ];
  expect(ids.every((i) => typeof i === "string" && i.length > 0)).toBe(true);
  expect(new Set(ids).size).toBe(ids.length);
});

test("every metric id is unique across the whole dataset", () => {
  const all = [...DATA.work, ...DATA.projects].flatMap((e) => e.metrics ?? []);
  const ids = all.map((m) => m.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("every featured metric id resolves to a real metric", () => {
  for (const id of DATA.featuredMetricIds) {
    const all = [...DATA.work, ...DATA.projects].flatMap((e) => e.metrics ?? []);
    expect(
      all.some((m) => m.id === id),
      `featuredMetricIds contains "${id}" which resolves to nothing`,
    ).toBe(true);
  }
});

test("resolveFeaturedMetrics returns them in declared order", () => {
  const got = resolveFeaturedMetrics(DATA).map((m) => m.id);
  expect(got).toEqual(DATA.featuredMetricIds);
});

test("at most two metrics are featured in the hero", () => {
  // The §5 container contract specifies the proof row carries two claims.
  // Without this, three or more ids would resolve, pass every other test, and
  // silently render an overflowing row.
  expect(DATA.featuredMetricIds.length).toBeLessThanOrEqual(2);
});

test("no placeholder or lorem values ship", () => {
  const all = [...DATA.work, ...DATA.projects].flatMap((e) => e.metrics ?? []);
  for (const m of all) {
    expect(m.value, `metric ${m.id}`).not.toMatch(/tbd|todo|lorem|xxx|\?\?\?/i);
    expect(m.label, `metric ${m.id}`).not.toMatch(/tbd|todo|lorem|xxx|\?\?\?/i);
  }
});
```

- [x] **Step 2: Run it and watch it fail**

```bash
npx playwright test evidence-schema.spec.ts
```

Expected: FAIL — `data/metrics.ts` does not exist and `DATA.work[n].id` is undefined.

- [x] **Step 3: Create `data/metrics.ts`**

```ts
/** A single quantified claim, attached to the record it came from. */
export type Metric = {
  /** Stable, unique across the whole dataset. Referenced by featuredMetricIds. */
  id: string;
  /** The number as it should render, e.g. "50 TB", "~35%". */
  value: string;
  /** Short caption, e.g. "corpus processed". */
  label: string;
  /** Optional qualifier shown only where space allows. */
  note?: string;
};

type WithMetrics = { readonly metrics?: readonly Metric[] };

/**
 * Resolve DATA.featuredMetricIds to Metric objects, preserving declared order.
 *
 * Returns [] when nothing is featured - the hero proof row is then omitted
 * entirely, per the spec's container contract. Unresolvable ids are dropped
 * here and caught loudly by tests/visual/evidence-schema.spec.ts rather than
 * rendering a hole.
 */
export function resolveFeaturedMetrics(data: {
  readonly featuredMetricIds: readonly string[];
  readonly work: readonly WithMetrics[];
  readonly projects: readonly WithMetrics[];
}): Metric[] {
  const all = [...data.work, ...data.projects].flatMap((e) => e.metrics ?? []);
  const byId = new Map(all.map((m) => [m.id, m]));
  return data.featuredMetricIds
    .map((id) => byId.get(id))
    .filter((m): m is Metric => m !== undefined);
}
```

- [x] **Step 4: Add ids and the empty featured list to `data/resume.tsx`**

Add a stable `id` to every `work` entry (slug of the company, e.g. `"sdaia"`, `"mizuho"`) and every `projects` entry (slug of the title). Add `metrics` to **no** entry yet — Phase 1b populates them. Then add the root field:

```ts
  /**
   * Metric ids featured in the hero proof row, in display order.
   * EMPTY until G3: Jeril must name the two claims and confirm they are
   * cleared for public attribution. The row renders nothing while this is
   * empty, which the spec's container contract permits.
   */
  featuredMetricIds: [] as string[],
```

Also import the type at the top of `data/resume.tsx`:

```ts
import type { Metric } from "./metrics";
```

**Then make `metrics` visible on the type — this is required, not stylistic.**

`data/resume.tsx` ends `} as const;`, so `DATA`'s type is *inferred from the literals*.
Omitting a property does **not** make it optional: it makes it absent. Every `e.metrics ?? []`
and `job.metrics` would be a type error, and `resolveFeaturedMetrics(DATA)` would not compile.
`satisfies` does **not** fix this either — it validates the literal while preserving that same
narrow inferred type, so the absent property stays absent.

Declare the entry types, matching the **real** field lists (`work` has `url`; `projects` has
`technologies`/`type`/`company` and no `url`):

```ts
export type WorkEntry = {
  readonly id: string;
  readonly company: string;
  readonly url: string;
  readonly title: string;
  readonly location: string;
  readonly start: string;
  readonly end: string;
  readonly description: string;
  readonly highlights: readonly string[];
  /** Populated in Phase 1b, gated on G3. Absent is legal. */
  readonly metrics?: readonly Metric[];
};

export type ProjectEntry = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly technologies: readonly string[];
  readonly type: string;
  readonly company: string;
  readonly metrics?: readonly Metric[];
};
```

**Keep `as const`.** Widen only the two arrays that need it, by asserting them at their
closing bracket:

```ts
  ] as readonly WorkEntry[],      // closes work
  ] as readonly ProjectEntry[],   // closes projects
```

An assertion on the property value survives the outer `as const`, so `DATA.work` becomes
`readonly WorkEntry[]` — including `metrics?` — while every other field keeps its literal
type. This is strictly less invasive than annotating the whole `DATA` object, which would
force every remaining section to be typed out explicitly: an object annotation cannot say
"the rest keeps its inferred shape".

And add the root field before the closing brace:

```ts
  featuredMetricIds: [] as readonly string[],
```

**Why this is safe, and why it actively helps:** `app/page.tsx:41` and `:107` already derive
their prop types from the data — `project: (typeof DATA.projects)[number]` and
`job: (typeof DATA.work)[number]`. Those now resolve to `ProjectEntry` and `WorkEntry`, which
**include `metrics?`**. That is exactly what the per-role evidence renderer in Task 3 Step 1b
needs, so this single change unblocks it too.

Verify immediately — this is the one step that can break the whole build. Add a temporary
probe, run the **project's** tsc so JSX settings apply, then delete the probe:

```ts
// probe-metrics.ts
import { DATA } from "@/data/resume";
import { resolveFeaturedMetrics } from "@/data/metrics";
const m = DATA.work[0].metrics ?? [];
const featured = resolveFeaturedMetrics(DATA);
type DerivedWork = (typeof DATA.work)[number];
const probe: DerivedWork["metrics"] = undefined;
export const out = [m.length, featured.length, probe];
```

```bash
npx tsc --noEmit; echo "exit: $?"    # must be 0
```

Check the exit code explicitly. Do **not** pipe tsc through `head` and chain `&& echo ok` —
`head` always exits 0, so a success message fires even when tsc failed.

- [x] **Step 5: Run the schema test — must pass**

```bash
npx playwright test evidence-schema.spec.ts
```

Expected: 5 passed. `featuredMetricIds` is empty, so the "resolves" and "declared order" tests pass trivially — that is correct, and Phase 1b makes them meaningful.

- [x] **Step 6: Gates and commit**

```bash
bash scripts/verify.sh --fast
git add data tests/visual/evidence-schema.spec.ts
git commit -m "Add evidence metric schema and resolver, with no content

Ids on every work and project entry, an optional metrics array, and
featuredMetricIds - empty until G3. resolveFeaturedMetrics returns [] when
nothing is featured so the hero proof row omits itself, per the spec's
container contract. Schema tests assert id uniqueness, that featured ids
resolve, and that no placeholder values ship."
```

---

### Task 2: Extract the client leaves

Done first, so the server extraction in Task 3 has somewhere to point. These are the only four things that genuinely need the client.

**Files:**
- Create: `components/sections/experience-card.tsx`, `components/chrome/social-rail.tsx`, `components/chrome/scroll-indicator.tsx`, `components/chrome/mobile-dock.tsx`
- Modify: `app/page.tsx` (import from the new files, delete the inlined versions)

**Interfaces:**
- Consumes: `DATA` (each client file imports it directly — hazard 1), `BlurFade`.
- Produces: `<ExperienceCard job={DATA.work[n]} delay={number} />`, `<SocialRail />`, `<ScrollIndicator delay={number} />`, `<MobileDock />`. `SocialRail` and `MobileDock` take **no props** by design.

- [x] **Step 1: `components/sections/experience-card.tsx`**

Move `page.tsx:103-189` verbatim, adding the directive and imports. It keeps `useState` and both `motion.div`s.

```tsx
"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Building2, Calendar, ChevronDown, MapPin } from "lucide-react";
import BlurFade from "@/components/magicui/blur-fade";
import type { DATA } from "@/data/resume";

export function ExperienceCard({
  job,
  delay,
}: {
  job: (typeof DATA)["work"][number];
  delay: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <BlurFade delay={delay}>
      {/* body copied verbatim from the previous app/page.tsx:113-187 */}
    </BlurFade>
  );
}
```

**Do not restyle anything while moving it.** This task must not change a pixel.

- [x] **Step 2: `components/chrome/social-rail.tsx`**

Move `page.tsx:372-406`. It **must** import `DATA` itself — `social.icon` is a component and cannot be passed across the boundary (hazard 1).

```tsx
"use client";

import Link from "next/link";
import BlurFade from "@/components/magicui/blur-fade";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DATA } from "@/data/resume";

const BLUR_FADE_DELAY = 0.04;

export function SocialRail() {
  return (
    /* body copied verbatim from the previous app/page.tsx:372-406 */
    <div className="hidden lg:flex fixed left-6 xl:left-10 bottom-0 flex-col items-center gap-6 after:content-[''] after:w-px after:h-24 after:bg-muted-foreground/30">
      {/* … */}
    </div>
  );
}
```

- [x] **Step 3: `components/chrome/scroll-indicator.tsx`**

Move `page.tsx:359-369`. Client because the `motion.div` runs an infinite loop.

```tsx
"use client";

import { motion } from "motion/react";
import { ArrowDown } from "lucide-react";
import BlurFade from "@/components/magicui/blur-fade";

export function ScrollIndicator({ delay }: { delay: number }) {
  return (
    <BlurFade delay={delay}>
      {/* body copied verbatim from the previous app/page.tsx:360-368 */}
    </BlurFade>
  );
}
```

Note for Phase 4: this infinite loop is why `tests/visual/helpers.ts` needs `lockMotion()`. Do not "fix" the loop here — motion correctness is Phase 4.

- [x] **Step 4: `components/chrome/mobile-dock.tsx`**

Move `page.tsx:753-782`. Client, and imports `DATA` itself (hazard 1).

- [x] **Step 5: Point `app/page.tsx` at the four new files**

Delete the inlined `ExperienceCard`, scroll indicator, social rail and dock from `app/page.tsx`; import the extracted components instead. `page.tsx` still has `"use client"` at this stage — Task 3 removes it.

- [x] **Step 6: Prove nothing moved**

```bash
bash scripts/ensure-browser-deps.sh
npm run build && npx playwright test
```

Expected: **all pass, including the 6 screenshots at zero tolerance.** A screenshot failure here means the move was not verbatim. Fix the component, never the snapshot.

- [x] **Step 7: Commit**

```bash
git add app/page.tsx components/sections/experience-card.tsx components/chrome
git commit -m "Extract the four client leaves from page.tsx

ExperienceCard (useState + 2 motion.div), SocialRail, ScrollIndicator
(infinite motion loop) and MobileDock. SocialRail and MobileDock import DATA
directly and take no props: social[].icon is a React component and cannot
cross the server/client boundary as a prop.

Verbatim moves - zero-tolerance screenshots still pass."
```

---

### Task 3: Extract the server sections and make `page.tsx` a Server Component

**Files:**
- Create: `components/sections/{hero,hero-proof-row,experience,selected-work,featured-project,skills,publications,education-awards,contact}.tsx`
- Create: `components/chrome/{email-rail,site-footer}.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: the four client leaves from Task 2; `resolveFeaturedMetrics` from Task 1.
- Produces: each section exported as a named function taking no props except `Hero`, which takes none either (it imports `DATA`). `<HeroProofRow metrics={Metric[]} />` returns `null` on an empty array.

- [x] **Step 1: `components/sections/hero-proof-row.tsx` — the empty container**

```tsx
import type { Metric } from "@/data/metrics";

/**
 * The hero's quantified-impact row. Renders NOTHING when no metrics are
 * featured - the spec's container contract requires omission rather than an
 * empty box, and forbids placeholder numbers. Must lay out correctly at 1
 * and at 2 metrics.
 */
export function HeroProofRow({ metrics }: { metrics: Metric[] }) {
  if (metrics.length === 0) return null;

  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-4 py-2">
      {metrics.map((m) => (
        <div key={m.id} className="flex flex-col">
          <dt className="font-mono text-2xl font-bold text-primary">
            {m.value}
          </dt>
          <dd className="text-sm text-muted-foreground">{m.label}</dd>
        </div>
      ))}
    </dl>
  );
}
```

- [x] **Step 1b: `components/sections/role-metrics.tsx` — the per-role container**

Spec §15 Phase 1a requires **both** containers: "hero proof row **and per-role evidence**,
both rendering nothing when empty". The hero row handles 0–2 featured claims; this one
handles 0..N claims on an individual role, and must be readable **without opening the
highlights disclosure** per §5.

```tsx
import type { Metric } from "@/data/metrics";

/**
 * A role's own quantified claims, rendered inside its experience entry and
 * OUTSIDE the collapsed highlights, so the evidence is visible without
 * expanding anything (spec §5).
 *
 * Renders nothing at zero. Unlike the hero row there is no cap - a role may
 * carry any number of claims.
 */
export function RoleMetrics({ metrics }: { metrics?: readonly Metric[] }) {
  if (!metrics || metrics.length === 0) return null;

  return (
    <dl className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
      {metrics.map((m) => (
        <div key={m.id} className="flex items-baseline gap-1.5">
          <dt className="font-mono text-sm font-semibold text-primary">
            {m.value}
          </dt>
          <dd className="text-xs text-muted-foreground">{m.label}</dd>
        </div>
      ))}
    </dl>
  );
}
```

`metrics` is optional here, not just possibly-empty, because `WorkEntry.metrics` is optional
and every entry omits it until Phase 1b. Render it from `ExperienceCard` as
`<RoleMetrics metrics={job.metrics} />`, positioned after the role's description and before
the highlights disclosure. `job.metrics` type-checks only because Task 1 Step 4 annotated
`DATA` — that is the dependency.

- [x] **Step 2: Extract the remaining sections verbatim**

One file each, no `"use client"`, no restyling. Source ranges in the pre-Task-2 `app/page.tsx`:

| New file | Source lines | Notes |
|---|---|---|
| `sections/hero.tsx` | 195–356 | imports `DATA`; renders `<HeroProofRow metrics={resolveFeaturedMetrics(DATA)} />` after the location row |
| `sections/featured-project.tsx` | 36–100 | pure presentational |
| `sections/selected-work.tsx` | 514–565 | uses `FeaturedProject` |
| `sections/experience.tsx` | 497–511 | maps `DATA.work` to the client `ExperienceCard` |
| `sections/skills.tsx` | 482–493 | |
| `sections/publications.tsx` | 568–615 | |
| `sections/education-awards.tsx` | 618–683 | **not verbatim** — see the two carve-outs below |
| `sections/contact.tsx` | 686–749 | **delete the hardcoded `05. What's Next?`** (hazard 3) |
| `chrome/email-rail.tsx` | 409–419 | server; no icons, no state |
| `chrome/site-footer.tsx` | 785–791 | server |

**Carve-out 1 — `education-awards.tsx` cannot be moved verbatim.** The school anchor at
`app/page.tsx:636` carries `onClick={(e) => e.stopPropagation()}`. A Server Component cannot
emit an event handler, so a verbatim move **fails the build**. There is no clickable ancestor,
so the handler suppresses nothing: **delete it** during extraction. Do not add `"use client"`
to keep it — that would drag a static list into the client bundle for a no-op.

**Carve-out 2 — the combined structure, specified.** "Two sections combined" is otherwise
ambiguous, so build exactly this:

```tsx
<section id="education-awards" className="...">
  <h2 className="numbered-heading">Education &amp; Awards</h2>
  <div className="grid gap-12 md:grid-cols-2">
    <div>
      <h3 className="...">Education</h3>
      {/* existing education list, unchanged apart from the deleted handler */}
    </div>
    <div>
      <h3 className="...">Awards</h3>
      {/* existing awards list, unchanged */}
    </div>
  </div>
</section>
```

One numbered `<h2>` for the combined section; the two former headings become plain `<h3>`
group labels and **lose** their `numbered-heading` class, because section numbering is
positional (hazard 3) and two numbers inside one section would double-count.

- [x] **Step 3: Split "About" (spec §5) — do not create an About section**

The old About block (`425–477`) is retired. Its content divides:

- The `DATA.summary` paragraphs become the **opening of Experience**, above the timeline, introduced by no heading of their own.
- The hero keeps only the existing short positioning copy (`234–245`) — unchanged.
- The old About block's 12-skill teaser and decorative photo are **deleted**; Skills already lists all 40, and the hero already shows the portrait.

- [x] **Step 4: Rewrite `app/page.tsx` as a Server Component in the new order**

```tsx
import { Hero } from "@/components/sections/hero";
import { Experience } from "@/components/sections/experience";
import { SelectedWork } from "@/components/sections/selected-work";
import { Skills } from "@/components/sections/skills";
import { Publications } from "@/components/sections/publications";
import { EducationAwards } from "@/components/sections/education-awards";
import { Contact } from "@/components/sections/contact";
import { SocialRail } from "@/components/chrome/social-rail";
import { EmailRail } from "@/components/chrome/email-rail";
import { ScrollIndicator } from "@/components/chrome/scroll-indicator";
import { MobileDock } from "@/components/chrome/mobile-dock";
import { SiteFooter } from "@/components/chrome/site-footer";

const BLUR_FADE_DELAY = 0.04;

// No "use client": this is a Server Component. The client leaves below are
// imported client components, and BlurFade accepts server-rendered children.
export default function Home() {
  return (
    <main className="relative min-h-screen">
      <Hero />
      <ScrollIndicator delay={BLUR_FADE_DELAY * 8} />
      <SocialRail />
      <EmailRail />

      {/* Order per spec §5: proof before inventory. */}
      <div className="relative z-10 px-6 md:px-12 lg:px-20 xl:px-24 max-w-6xl mx-auto pb-24">
        <Experience />
        <SelectedWork />
        <Skills />
        <Publications />
        <EducationAwards />
        <Contact />
      </div>

      <MobileDock />
      <SiteFooter />
    </main>
  );
}
```

- [x] **Step 5: Confirm `page.tsx` really is a Server Component**

```bash
grep -c '"use client"' app/page.tsx
```

Expected: `0`. Then confirm the client boundary is where you intended:

```bash
grep -l '"use client"' components/sections/*.tsx components/chrome/*.tsx
```

Expected exactly: `experience-card.tsx`, `social-rail.tsx`, `scroll-indicator.tsx`, `mobile-dock.tsx`.

- [x] **Step 6: Build and expect screenshots to FAIL**

```bash
npm run build && npx playwright test
```

Expected: `evidence-schema`, `source-contract` and `token-contract` **pass**; the 6 screenshots **fail**. That is correct — the IA changed on purpose.

- [x] **Step 7: Add the IA order test, then regenerate the baseline**

Create `tests/visual/ia-order.spec.ts`:

```ts
import { test, expect } from "@playwright/test";
import { DATA } from "../../data/resume";

const EXPECTED = [
  "hero",
  "experience",
  "selected-work",
  "skills",
  "publications",
  "education-awards",
  "contact",
];

test("sections render in the spec-mandated order, proof before inventory", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const ids = await page.$$eval("section[id]", (els) => els.map((e) => e.id));
  expect(ids).toEqual(EXPECTED);
});

test("no About section survives the split", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  expect(await page.locator("section#about").count()).toBe(0);
  // and no heading reintroduces it under another element
  expect(
    await page.getByRole("heading", { name: /^about$/i }).count(),
  ).toBe(0);
});

test("the positioning summary moved INTO Experience", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // Take a distinctive clause from the real summary rather than a fuzzy match.
  const probe = DATA.summary.split(/[.\n]/)[0].trim().slice(0, 40);
  expect(probe.length, "summary probe must be substantial").toBeGreaterThan(15);
  await expect(page.locator("section#experience")).toContainText(probe);
  await expect(page.locator("section#hero")).not.toContainText(probe);
});

test("the duplicated skill teaser and decorative photo are gone", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });

  // The teaser's signature is a LITERAL <span>▹</span> (old page.tsx:453).
  // The highlight bullets at old :177 use before:content-['▹'], which is CSS
  // generated content and therefore invisible to text matching - so this
  // counts the teaser only, and must be 0 once it is deleted.
  expect(await page.getByText("▹", { exact: true }).count()).toBe(0);

  // Skills is the single source of the skill list.
  await expect(page.locator("section#skills")).toContainText(DATA.skills[0]);

  // Two <Image>s existed: the hero portrait (old :337) and the About
  // decorative photo (old :463). Only the portrait survives.
  expect(await page.locator("main img").count()).toBe(1);
  expect(await page.locator("section#hero img").count()).toBe(1);
});

test("Education and Awards are ONE section with one numbered heading", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const s = page.locator("section#education-awards");
  await expect(s).toHaveCount(1);
  expect(await page.locator("section#education, section#awards").count()).toBe(0);
  // exactly one numbered h2, and both groups present as h3
  expect(await s.locator("h2.numbered-heading").count()).toBe(1);
  expect(await s.locator("h3").count()).toBe(2);
  expect(await s.locator("h3.numbered-heading").count()).toBe(0);
});

test("both evidence containers are absent while no metrics exist", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // Container contract: omitted entirely, not an empty box.
  expect(await page.locator("section#hero dl").count()).toBe(0);
  expect(await page.locator("section#experience dl").count()).toBe(0);
});
```

Add the 0..N container contract to `tests/visual/evidence-schema.spec.ts`. These are Server
Components with no hooks, so calling them as plain functions is legitimate and needs no
renderer — it proves the null-return contract without waiting for Phase 1b content:

```ts
import { HeroProofRow } from "../../components/sections/hero-proof-row";
import { RoleMetrics } from "../../components/sections/role-metrics";

const M = (id: string) => ({ id, value: "1", label: "x" });

test("evidence containers render nothing when empty, something when not", () => {
  expect(HeroProofRow({ metrics: [] })).toBeNull();
  expect(HeroProofRow({ metrics: [M("a")] })).not.toBeNull();
  expect(HeroProofRow({ metrics: [M("a"), M("b")] })).not.toBeNull();

  expect(RoleMetrics({}), "absent metrics").toBeNull();
  expect(RoleMetrics({ metrics: [] }), "empty metrics").toBeNull();
  // per-role evidence is uncapped, unlike the hero row
  expect(RoleMetrics({ metrics: [M("a"), M("b"), M("c")] })).not.toBeNull();
});
```

Give each new section the `id` used above. **Three ids change** — `projects` →
`selected-work`, `education` + `awards` → the single `education-awards`, and `about` is
deleted. Verified safe: the repo contains **no** in-page anchors at all — no `href="#…"`, no
`getElementById`, no `scrollIntoView`, and no nav/dock item list referencing section ids. The
renames therefore break no navigation, and no redirect or alias handling is needed. Then:

```bash
npx playwright test ia-order.spec.ts evidence-schema.spec.ts   # must pass BEFORE regenerating
npx playwright test --update-snapshots
npx playwright test --repeat-each=3
```

The semantic tests passing first is what makes regeneration legitimate. **Inspect all six
diffs, not one** — there are three widths across two themes, and a mistake confined to dark
or to 375px is invisible in the light desktop diff.

- [x] **Step 8: Full gates and commit**

```bash
bash scripts/verify.sh
git add app components tests
git commit -m "Decompose page.tsx into server sections and resequence the IA

app/page.tsx drops \"use client\" and becomes a Server Component composing
section components. Only four client leaves remain: ExperienceCard,
SocialRail, ScrollIndicator, MobileDock. BlurFade stays client but accepts
server-rendered children, so wrapping does not force a section client.

IA resequenced per spec §5 - Experience and Selected work now precede Skills,
so a recruiter meets evidence before an inventory claim. About is split: its
summary paragraphs open Experience, the hero keeps the short positioning copy,
and the duplicate skills teaser and decorative photo are dropped.

Deleted the hardcoded '05. What's Next?' in Contact: .numbered-heading
assigns numbers by DOM order via counter-increment, so a literal was already
inconsistent and resequencing would worsen it.

Screenshots regenerated deliberately AFTER tests/visual/ia-order.spec.ts
passed, so the new order is asserted independently of the images."
```

---

### Task 4: Verify the boundary actually moved

Verification only. **No commit.**

**Files:** verify only.

**Interfaces:** consumes the decomposed tree.

- [x] **Step 1: Confirm the client bundle shrank**

```bash
npm run build
find out/_next/static -name "*.js" | xargs cat | wc -c
```

Record the number. Compare against the pre-decomposition figure from `git stash`-free history if available; otherwise note it as the new reference. A decomposition that moves 7 of 9 sections to the server should not *increase* client JS.

- [x] **Step 2: Confirm no server/client serialisation error appears**

```bash
npm run build 2>&1 | grep -iE "cannot be passed|not serializable|only be used in a client component" || echo "CLEAN"
```

Expected: `CLEAN`. Hazard 1 would surface here.

- [x] **Step 3: Fix the disclosure's accessibility while it is being moved**

The button being relocated into `experience-card.tsx` has `onClick` but **no**
`aria-expanded` and **no** `aria-controls`, and the panel animates to `height: 0` while
remaining in the accessibility tree — so collapsed achievements are still announced. Spec §9
puts disclosure keyboard operation *and state* in browser acceptance, so fix it here rather
than deferring: this is the one moment the component is already open for editing.

`ExperienceCard` is a Client Component, so use `useId` for a stable pairing:

```tsx
const panelId = useId();
// ...
<button
  type="button"
  onClick={() => setIsOpen(!isOpen)}
  aria-expanded={isOpen}
  aria-controls={panelId}
  className="..."
>
```

Give the animated panel `id={panelId}`, and keep it out of the a11y tree while collapsed —
`hidden` would fight the height animation, so gate the tree instead:

```tsx
<motion.div id={panelId} aria-hidden={!isOpen} inert={!isOpen} ...>
```

`type="button"` is added because the element sits inside no form today but would submit one
if a form is ever introduced around it.

- [x] **Step 4: Prove the interactions deterministically**

Replace the "manually confirm" step this plan originally had — a manual check is not
reproducible for an autonomous executor, and this is exactly the behaviour the refactor put
at risk. Add to `tests/visual/ia-order.spec.ts`:

```ts
test("the experience disclosure is keyboard operable and reports state", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const button = page
    .locator("section#experience button[aria-controls]")
    .first();

  await expect(button).toHaveAttribute("aria-expanded", "false");
  const panelId = await button.getAttribute("aria-controls");
  const panel = page.locator(`#${panelId}`);
  await expect(panel).toHaveAttribute("aria-hidden", "true");

  // keyboard, not mouse - this is the assertion that matters for §9
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toHaveAttribute("aria-hidden", "false");
  await expect(panel).toContainText(/\S/);

  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "false");
});

for (const width of [375, 768, 1280]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow, `${width}px overflows by ${overflow}px`).toBeLessThanOrEqual(0);
  });
}
```

Then run the whole suite:

```bash
npx playwright test --repeat-each=3
```

The theme toggle and dock magnification are already covered by the existing screenshot
baseline at both themes, so they need no separate manual pass.

- [x] **Step 5: Confirm clean tree**

```bash
git status --porcelain
```

Expected: empty.

---

## Self-Review

**1. Spec coverage.** Implements §15 Phase 1a fully: decomposition (Tasks 2–3), IA resequence (Task 3 step 4), About split (Task 3 step 3), schema plus build-time id check (Task 1), and **both** containers honouring the §5 container contract — hero proof row (Task 3 step 1) and per-role evidence (Task 3 step 1b). Phase 1b is explicitly excluded and gated on G3.

**2. Placeholder scan.** No TBD/TODO. Where a body is moved verbatim the plan gives the exact source line range rather than re-printing 60 lines of unchanged JSX — the move is mechanical and re-printing it would invite drift between plan and reality. All new code is written out in full. The two places a move is **not** verbatim (the `stopPropagation` handler, the combined Education + Awards structure) are called out as explicit carve-outs.

**3. Type consistency.** `Metric` is defined in Task 1 step 3 and imported in Task 3 steps 1 and 1b. `resolveFeaturedMetrics(data)` is defined in Task 1 and called in Task 3 step 2. `ExperienceCard`, `SocialRail`, `ScrollIndicator`, `MobileDock` are created in Task 2 with the exact prop shapes used in Task 3 step 4. Section `id`s in `ia-order.spec.ts` match those assigned in Task 3 step 7. `WorkEntry.metrics` is `readonly Metric[] | undefined`, and both `RoleMetrics` and `resolveFeaturedMetrics` accept `readonly` metric arrays accordingly.

**4. Corrections applied after Oracle review** (`reviews/2026-09-01-phase1a-phase2-plans-oracle.md`, verdict `FIX-FIRST`). All eight findings verified true against the code before fixing:

| Finding | Fix |
|---|---|
| The optional-`metrics` instruction was not executable — `data/resume.tsx:394` is `} as const;`, so an omitted property is *absent*, not optional, and `satisfies` would not help either | Task 1 step 4 now declares `WorkEntry`/`ProjectEntry` and annotates `DATA`, removing `as const`. Verified safe: the only `typeof DATA` uses are `page.tsx:41`/`:107`, which *benefit* — their derived prop types then include `metrics?` |
| `education-awards.tsx` could not be a verbatim Server Component — `page.tsx:636` has `onClick={(e) => e.stopPropagation()}` | Carve-out 1: delete the handler during extraction. It suppresses nothing — there is no clickable ancestor |
| The per-role evidence container required by §15 was missing entirely | New Task 3 step 1b: `RoleMetrics`, uncapped, rendered outside the collapsed disclosure per §5 |
| "Extract verbatim" contradicted "combined under one heading" | Carve-out 2 specifies the exact structure: one numbered `<h2>`, two plain `<h3>` groups that lose `numbered-heading` so positional numbering does not double-count |
| The regeneration gate proved only DOM order | `ia-order.spec.ts` now also asserts the summary moved into Experience, the teaser and photo are gone, Education + Awards is one section, and both containers are absent while empty. All six diffs are inspected, not one |
| Disclosure a11y left manual, preserving a known defect | Task 4 steps 3–4 add `aria-expanded`/`aria-controls`/`inert` and a keyboard-driven Playwright test, plus no-horizontal-overflow assertions at 375/768/1280 |
| Featured cardinality unenforced | `evidence-schema.spec.ts` asserts `featuredMetricIds.length <= 2` |
| Client-boundary counts inconsistent ("five" vs "four") | Architecture note now distinguishes the four files *this phase creates* from the pre-existing client module graph |

**5. Known risk.** Task 3 deliberately breaks the screenshot baseline. That is the one place this plan regenerates snapshots, and it is gated on the semantic tests passing first so the new IA is asserted by something other than the images.
