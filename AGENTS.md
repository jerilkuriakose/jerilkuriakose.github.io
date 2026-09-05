# Portfolio Site — Agent Instructions (and its CV contract)

> ## The redesign is COMPLETE — nothing is in flight
>
> All seven phases shipped and all four owner gates (G1–G4) closed on 2026-09-01.
> `verify.sh` green at 99 tests. Both repos clean and pushed. **There is no queued work
> and no uncommitted work to protect** — an earlier version of this banner warned about an
> uncommitted Next 16 upgrade; that shipped in `576c5c3` and the warning is retired.
>
> **Before changing anything here:**
> ```bash
> bash scripts/verify.sh              # build + tsc + lint + 99-test visual harness
> bash scripts/redesign-status.sh     # derives phases, gates, reviews, live build state
> ```
>
> **Read these before touching CSS, colour, type, motion or photography** — they record
> defects that cost real debugging and that no amount of code reading reveals:
> - `docs/superpowers/TRACKER.md` §"Rules this project paid for" — 11 traps, incl. Tailwind 4
>   stripping `@layer components`, `var()` substituting where DECLARED, and gates that
>   sample animation frame 0
> - `docs/superpowers/specs/2026-08-31-portfolio-redesign-design.md` §11b — the light-theme
>   photo prominence is **accepted, not a bug**, with both disproven fixes and their numbers
> - §11b "Known harness gap" — nothing asserts the photographs are *visible*, so 99 green
>   tests would not catch a photo veiled out of existence
>
> **If you start a new multi-session project here**, restore the write-through discipline:
> record each fact in its artifact in the same turn it changes (reviews → `reviews/`, gates →
> spec checkboxes, progress → plan checkboxes, next action → `TRACKER.md`). Sessions get
> compacted without warning, so anything keyed to "session end" silently never happens.
>
> Full environment notes and traps: `../AGENTS.md` in the workspace root.

## The CV relationship — read this before editing `data/resume.tsx`

The sibling repo `../jk-cv` builds the CV. **It is no longer a LaTeX repo, and neither
side is "the source of truth" for the other.** An earlier version of this file said
"LaTeX → Portfolio, LaTeX is the source of truth" and then admitted the workflow was
unverifiable because no TeX toolchain exists here. Both halves of that are now obsolete:

- CV content is authored in **`../jk-cv/data/cv.json`**, rendered to HTML by
  `src/template.js`, and printed to PDF by **headless Chromium** (`playwright-core`). It
  builds here, in one command, and is verified by 17 poppler-based gates.
- Site content is authored in **`data/resume.tsx`** (one exported `DATA` object).
- The two documents **share some facts and deliberately diverge on others.** The overlap
  is a machine-checked contract, not a prose instruction.

```bash
cd ../jk-cv && make check-sync    # every shared CV value must be present in resume.tsx
```

It exits non-zero and **names the diverging fields**. Run it after any edit to a shared
fact on either side. It also fails when this repo is absent (`--allow-missing-site` is the
explicit escape hatch), because a check that silently passes having verified nothing is
worse than no check.

### What the contract compares

Keyed by a stable `id` per record, defined in `../jk-cv/src/shared-fields.mjs`:

| `cv.json` | `data/resume.tsx` (`DATA`) | Compared |
|---|---|---|
| `basics.email`, `basics.tel` | `contact.email`, `contact.tel` | yes — phone by digits, so the site's unspaced `wa.me` form is not drift |
| `publications[].title`, `.year` | `publications[]` | yes |
| `education[].school`, `.degree` | `education[]` | yes |
| `awards[].title`, `.organization` | `awards[]` | yes |
| `work[].company`, `.title` — only roles the CV still lists in full | `work[]` | yes |

Comparison collapses whitespace, folds dashes (an en dash in the CV matches an ASCII
hyphen here), and tolerates values this file wraps across lines. **Array lengths are never
compared** — counting would pass while every value diverged, and it would false-fail on the
collapsed roles below.

### What deliberately diverges — do NOT "fix" these

| Divergence | Why |
|---|---|
| `projects` (7 here, none in the CV) | site-only by design |
| `skills` flat here, 4 groups in the CV | presentational choice on both sides |
| Role bullets: the CV compresses, the site does not | CV has a page budget; the site does not |
| The CV collapses pre-2017 roles into one "Earlier Experience" line; the site lists all 8 | O4 compression. Collapsed roles drop out of the contract |
| `man-hours` here (8 occurrences) vs `person-hours` in the CV | **decision O2, not yet owner-approved for the site.** The CV's schema bans `man-hours`; the site keeps it until the owner says otherwise. Metric labels are not in the contract, so `check-sync` passes |
| Stack Overflow link here, absent from the CV | a reputation profile, not a credential; the CV's contact line is capped at three links (portfolio, LinkedIn, GitHub) |
| `jerilkuriakose.github.io` appears in the CV's links but in no URL here | expected — the host is explicitly exempt from the link check |
| `extraInfo: "Saudi Arabia Premium Resident"` here | the CV puts residency in its **gulf** variant only, and gate G-p asserts the international PDF never carries it |

### The PDF

Refresh it with one command in the CV repo:

```bash
cd ../jk-cv && make deploy       # builds, verifies, copies the international PDF here
make check-deploy                # (still in ../jk-cv) fails if this repo's PDF is stale
```

- `make deploy` re-runs the CV's verify + check-sync, then copies the **international**
  build to `public/Jeril_Kuriakose_CV.pdf` and hash-verifies it. It does not commit or
  push — it stages the binary in this repo's working tree.
- `DATA.resumeUrl` is already `/Jeril_Kuriakose_CV.pdf`, so refreshing the CV needs **no
  code change here** — commit the replaced binary.
- Publish the **`international`** variant only. Both variants now carry the portrait and
  the language levels; `CV-Jeril Kuriakose-Gulf.pdf` adds only the residency line
  (nationality, work authorization) and is for direct applications, never the web.
- This repo's `scripts/verify.sh` runs `../jk-cv/scripts/check-deploy.mjs`, so a stale
  published CV turns `verify.sh` red here (skipped only when `../jk-cv` is absent).
- `output: 'export'` means the PDF is served as a plain static file from `public/`; there
  is no route handler or redirect involved.

### Workflow for a content change

1. Edit `../jk-cv/data/cv.json` (CV) and/or `data/resume.tsx` (site).
2. `cd ../jk-cv && make verify` — fully green: 17/17 gates on both variants and the whole
   unit suite. There is no sanctioned failure since the 2026-09-04 A4 redesign. Anything
   red is a real defect.
3. `make check-sync` — green, or it names what diverged. Fix the divergence unless it is on
   the accepted list above.
4. If the CV changed, `make deploy` (in `../jk-cv`) — it re-runs verify + check-sync and
   copies the international PDF here. `make check-deploy` confirms this repo's published PDF
   is the current build.
5. `bash scripts/verify.sh` here — must exit 0.
6. **Commit each repo separately.** They are independent git repos. Never assume one
   command touches both, and never commit unless asked.

## Where site content lives

`data/resume.tsx` exports one `DATA` object: `name`, `initials`, `title`, `location`,
`locationLink`, `description`, `summary`, `avatarUrl`, `resumeUrl`, `extraInfo`,
`yearsOfExperience`, `contact`, `skills`, `work`, `education`, `projects`,
`publications`, `awards`, `languages`, `featuredMetricIds`. Single route, static export,
GitHub Pages. Stack, deploy details and the Tailwind 4 traps are in `../AGENTS.md` §3–§6
and `docs/tailwind4-notes.md`.

## Definition of done

```bash
bash scripts/verify.sh            # build + tsc + lint + visual harness
bash scripts/verify.sh --fast     # skip the browser harness
```

Exits 0 only if every gate passes. CI uses `npm ci`, so verify that path before claiming a
change is deployable. For visual work, pixel-diff against the committed baseline
(`npm run test:visual`, literal zero tolerance) rather than eyeballing.
