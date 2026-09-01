# Phase 0 — Mechanical OKLCH Token Conversion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Convert every colour **token** in `app/globals.css` from space-separated HSL channels to full OKLCH values at pixel-identical rendered output, proven by a committed verification harness.

**Architecture:** Build the verification harness first and prove it can fail. Capture the pre-migration baseline from a **disposable git worktree** pinned to a known commit, so nothing in the working tree can contaminate it or be destroyed by it. Then convert tokens, `@theme inline` and all `hsl(var(…))` call sites in one atomic change, because `hsl(oklch(…))` is invalid CSS. Verification is three-layered: an exact **8-bit pixel assertion per token** (the real proof), a **static source contract** (proves all replacements happened), and **screenshots** (broad rendering coverage only).

**Tech Stack:** Next.js 16.3.3 (Turbopack, static export), React 19.2.8, Tailwind CSS 4.3.3 (CSS-first `@theme inline`), `@playwright/test` (new), Chromium from `~/.cache/ms-playwright`.

**Spec:** `docs/superpowers/specs/2026-08-31-portfolio-redesign-design.md` — implements **Phase 0** of §15 only. Phases 1–6 require their own plans.

## Global Constraints

- Node `>=20.9.0` (Next 16). Local v26.7.0; CI pinned to 22.
- **Do not upgrade ESLint to 10.** Pinned `^9.39.5`; `eslint-plugin-react` inside `eslint-config-next@16.3.3` calls a removed API and lint dies.
- `tailwind.config.ts` does not exist. Theme config lives in `app/globals.css` via `@theme inline`.
- `next/font` must never claim `--font-sans` / `--font-mono` (Tailwind-generated). Fonts are `--font-inter`, `--font-jetbrains-mono`.
- Never add `leading-*` beside a `text-{size}` utility without checking rendered line-height — Tailwind 4 reversed v3 precedence.
- `output: 'export'`; `images.unoptimized: true` forced.
- Playwright browsers already cached at `~/.cache/ms-playwright`; system libs already installed. **Never run `playwright install` or `install-deps`.** Always pass an explicit `executablePath`.
- **Phase 0 changes no rendered colour.** Any pixel difference is a defect, never a design decision.
- Definition of done for every task: `npm ci` → `npm run build` → `npx tsc --noEmit` → `npm run lint`, all exit 0.

---

## Two empirical findings that govern this plan

Both were measured in Chromium 141 via a 1×1 canvas sample, not calculated. **Do not "simplify" past them.**

**1. Four decimal places is insufficient.** `--primary` drifts by one 8-bit unit:

| Value | Source pixel | at 4dp | at 6dp |
|---|---|---|---|
| `hsl(166 76% 47%)` | `[29,211,168]` | `[28,211,168]` ✗ | `[29,211,168]` ✓ |

**Therefore: L and C to 6 decimals, hue to 4.**

**2. The one hard-coded literal must NOT be converted.** `app/globals.css:203` (`.gradient-text`) contains `hsl(166 100% 50%)` — a fully-saturated spring green sitting **on the sRGB gamut boundary** (R=0). It renders `[0,255,195]`, but every OKLCH round-trip yields `[0,255,196]` at 4dp *and* 6dp. It cannot be converted without changing a pixel.

**Therefore: leave line 203 exactly as it is.** It is a literal, not a token; Phase 0 migrates the token graph. The Phase 2 palette retune replaces this gradient anyway. The completion assertion is *zero `hsl(var(`*, **not** zero `hsl(`.

---

## File Structure

| File | Responsibility |
|---|---|
| `package.json` | add `@playwright/test` devDep + `test:visual` scripts |
| `playwright.config.ts` | **create** — viewports, zero-tolerance screenshot config, static server |
| `tests/visual/helpers.ts` | **create** — settle + freeze helpers, canvas sampler, theme setter |
| `tests/visual/token-contract.spec.ts` | **create** — exact 8-bit assertion per token (the real proof) |
| `tests/visual/source-contract.spec.ts` | **create** — static assertions on `globals.css` |
| `tests/visual/tokens.spec.ts` | **create** — screenshots, light + dark × 3 widths |
| `app/globals.css` | **modify** — tokens, `@theme inline`, `hsl(var(…))` call sites |
| `.gitignore` | **modify** — ignore Playwright output |

---

## Reference: the conversion table (6dp — use verbatim)

| HSL (current) | OKLCH (use this) | Renders |
|---|---|---|
| `222 47% 11%` | `oklch(0.206407 0.038822 265.5472)` | `[15,23,41]` |
| `222 41% 15%` | `oklch(0.246364 0.044214 265.6513)` | `[23,32,54]` |
| `222 33% 19%` | `oklch(0.287403 0.043441 265.9893)` | `[32,42,64]` |
| `222 33% 25%` | `oklch(0.341124 0.054741 265.8789)` | `[43,55,85]` |
| `215 14% 58%` | `oklch(0.653819 0.029859 256.7816)` | `[133,145,163]` |
| `214 15% 67%` | `oklch(0.731267 0.024129 255.1074)` | `[158,169,183]` |
| `213 14% 80%` | `oklch(0.840359 0.013020 253.3208)` | `[197,203,211]` |
| `210 14% 97%` | `oklch(0.976673 0.001831 247.8405)` | `[246,247,248]` |
| `166 100% 70%` | `oklch(0.908654 0.139721 174.8630)` | `[102,255,219]` |
| `166 76% 47%` | `oklch(0.773404 0.147474 170.8866)` | `[29,211,168]` |
| `0 0% 100%` | `oklch(1 0 0)` | `[255,255,255]` |
| `210 40% 96.1%` | `oklch(0.968435 0.006816 247.8951)` | `[241,245,249]` |
| `215 16% 47%` | `oklch(0.556392 0.039801 256.8166)` | `[101,117,139]` |
| `0 84% 60%` | `oklch(0.635577 0.208196 25.3782)` | `[239,67,67]` |
| `0 0% 98%` | `oklch(0.9848 0 0)` | `[250,250,250]` |
| `214 32% 91%` | `oklch(0.925769 0.013209 255.0276)` | `[225,231,239]` |
| `0 63% 31%` | `oklch(0.399643 0.134794 25.7682)` | `[129,29,29]` |

### Alpha call sites — 16 of them

`hsl(var(--x) / <a>)` → `color-mix(in oklab, var(--x) <a×100>%, transparent)`.

This is **provably equivalent**, not an approximation: `color-mix` interpolates premultiplied, so mixing opaque `C` at fraction `p` with transparent gives premultiplied `p×C` and alpha `p`; unpremultiplying divides by `p`, restoring `C` exactly with alpha `p`. `color-mix()` is also chosen over relative colour syntax (`oklch(from var(--x) l c h / .3)`) for its safer support floor — `color-mix()` and absolute `oklch()` have been interoperable since May 2023, relative syntax only from ~Chrome 125 / Firefox 128 / Safari 18.

| Was | Count | Becomes |
|---|---|---|
| `hsl(var(--muted-foreground) / 0.3)` | 2 | `color-mix(in oklab, var(--muted-foreground) 30%, transparent)` |
| `hsl(var(--muted-foreground) / 0.5)` | 1 | `color-mix(in oklab, var(--muted-foreground) 50%, transparent)` |
| `hsl(var(--primary) / 0.1)` | 1 | `color-mix(in oklab, var(--primary) 10%, transparent)` |
| `hsl(var(--primary) / 0.15)` | 2 | `color-mix(in oklab, var(--primary) 15%, transparent)` |
| `hsl(var(--primary) / 0.2)` | 2 | `color-mix(in oklab, var(--primary) 20%, transparent)` |
| `hsl(var(--primary) / 0.3)` | 3 | `color-mix(in oklab, var(--primary) 30%, transparent)` |
| `hsl(var(--primary) / 0.5)` | 2 | `color-mix(in oklab, var(--primary) 50%, transparent)` |
| `hsl(var(--border) / 0.5)` | 2 | `color-mix(in oklab, var(--border) 50%, transparent)` |
| `hsl(var(--background) / 0.8)` | 1 | `color-mix(in oklab, var(--background) 80%, transparent)` |

`--accent-tint` (`166 100% 70% / 0.1`) is a channel triplet *with* alpha that only worked inside `hsl()`. It becomes a self-contained `color-mix()`. **It currently has no consumer anywhere in the codebase** — preserve and convert it for token compatibility; do not delete or redesign it in Phase 0. Its correctness is covered by the source contract, never by screenshots.

---

### Task 1: Verification harness

**Files:** modify `package.json`, `.gitignore`; create `playwright.config.ts`, `tests/visual/helpers.ts`, `tests/visual/token-contract.spec.ts`, `tests/visual/source-contract.spec.ts`, `tests/visual/tokens.spec.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `npm run test:visual`, `npm run test:visual:update`. `helpers.ts` exports `setTheme(page, theme)`, `settle(page)`, `freezeVisuals(page)`, `sample8bit(page, css)`, and type `Theme`.

- [x] **Step 1: Install the runner**

```bash
cd /home/sagemaker-user/others/mydata/portfolio/jerilkuriakose.github.io
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install -D @playwright/test
```

- [x] **Step 2: Add scripts to `package.json`**

```json
"test:visual": "playwright test",
"test:visual:update": "playwright test --update-snapshots"
```

- [x] **Step 3: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

const CHROME =
  process.env.CHROME_PATH ??
  "/home/sagemaker-user/.cache/ms-playwright/chromium-1194/chrome-linux/chrome";

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  expect: {
    // Phase 0 changes no colour, so start at ZERO tolerance.
    // Only widen after observing real flake, and only to the smallest
    // measured value, with the reason recorded in the commit message.
    toHaveScreenshot: {
      maxDiffPixels: 0,
      threshold: 0,
      animations: "disabled",
      caret: "hide",
    },
  },
  use: {
    ...devices["Desktop Chrome"],
    launchOptions: { executablePath: CHROME },
    baseURL: "http://127.0.0.1:8099",
  },
  webServer: {
    // Matches the workspace's established static-server command.
    // reuseExistingServer stays false: a stale `out/` from another
    // session would otherwise silently pass a fidelity baseline.
    command: "python3 -m http.server 8099 --directory out",
    url: "http://127.0.0.1:8099",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
```

- [x] **Step 4: Create `tests/visual/helpers.ts`**

```ts
import type { Page } from "@playwright/test";

export type Theme = "light" | "dark";

/** Set the theme BEFORE first navigation so no wrong-theme frame renders. */
export async function setTheme(page: Page, theme: Theme): Promise<void> {
  // next-themes@0.4.6 default storageKey is "theme".
  await page.addInitScript((t) => {
    window.localStorage.setItem("theme", t as string);
  }, theme);
}

export async function settle(page: Page): Promise<void> {
  await page.mouse.move(4, 4);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    await Promise.all(
      Array.from(document.images)
        .filter((i) => !i.complete)
        .map(
          (i) =>
            new Promise<void>((res) => {
              i.addEventListener("load", () => res(), { once: true });
              i.addEventListener("error", () => res(), { once: true });
            }),
        ),
    );
  });
  await page.waitForTimeout(800);
}

/**
 * Headless SwiftShader renders large blur radii as concentric ring
 * artifacts — a rasterisation artifact, not a CSS bug — which makes
 * diffs meaningless. Also stop animation so frames are deterministic.
 */
export async function freezeVisuals(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
      * { filter: none !important; }
      html { scroll-behavior: auto !important; }
    `,
  });
}

/**
 * Resolve a CSS colour to its USED 8-bit sRGB value.
 * getComputedStyle() preserves oklch() verbatim rather than serialising
 * to rgb(), so string comparison is not portable. A 1x1 canvas gives the
 * actual rendered bytes.
 */
export async function sample8bit(page: Page, css: string): Promise<number[]> {
  return page.evaluate((colour) => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = colour;
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).backgroundColor;
    probe.remove();

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("2D canvas unavailable");
    ctx.fillStyle = resolved;
    ctx.fillRect(0, 0, 1, 1);
    return Array.from(ctx.getImageData(0, 0, 1, 1).data);
  }, css);
}
```

- [x] **Step 5: Create `tests/visual/token-contract.spec.ts` — the real proof**

Screenshots cannot prove all 49 replacements (they never exercise focus, hover, selection, or unused tokens). This does, per token, in both themes.

```ts
import { test, expect } from "@playwright/test";
import { sample8bit, setTheme, type Theme } from "./helpers";

/** Expected USED 8-bit sRGB per token. Must not change in Phase 0. */
const EXPECTED: Record<Theme, Record<string, number[]>> = {
  light: {
    "--background": [255, 255, 255, 255],
    "--foreground": [15, 23, 41, 255],
    "--card": [255, 255, 255, 255],
    "--card-foreground": [15, 23, 41, 255],
    "--popover": [255, 255, 255, 255],
    "--popover-foreground": [15, 23, 41, 255],
    "--primary": [29, 211, 168, 255],
    "--primary-foreground": [15, 23, 41, 255],
    "--secondary": [241, 245, 249, 255],
    "--secondary-foreground": [15, 23, 41, 255],
    "--muted": [241, 245, 249, 255],
    "--muted-foreground": [101, 117, 139, 255],
    "--accent": [102, 255, 219, 255],
    "--accent-bg": [241, 245, 249, 255],
    "--accent-foreground": [15, 23, 41, 255],
    "--destructive": [239, 67, 67, 255],
    "--destructive-foreground": [250, 250, 250, 255],
    "--border": [225, 231, 239, 255],
    "--input": [225, 231, 239, 255],
    "--ring": [29, 211, 168, 255],
    "--navy": [15, 23, 41, 255],
    "--navy-light": [23, 32, 54, 255],
    "--navy-lighter": [32, 42, 64, 255],
    "--slate": [133, 145, 163, 255],
    "--slate-light": [158, 169, 183, 255],
    "--lightest-slate": [197, 203, 211, 255],
    "--white": [246, 247, 248, 255],
  },
  dark: {
    "--background": [15, 23, 41, 255],
    "--foreground": [197, 203, 211, 255],
    "--card": [23, 32, 54, 255],
    "--card-foreground": [197, 203, 211, 255],
    "--popover": [23, 32, 54, 255],
    "--popover-foreground": [197, 203, 211, 255],
    "--primary": [102, 255, 219, 255],
    "--primary-foreground": [15, 23, 41, 255],
    "--secondary": [32, 42, 64, 255],
    "--secondary-foreground": [197, 203, 211, 255],
    "--muted": [32, 42, 64, 255],
    "--muted-foreground": [133, 145, 163, 255],
    "--accent-bg": [32, 42, 64, 255],
    "--accent-foreground": [197, 203, 211, 255],
    "--destructive": [129, 29, 29, 255],
    "--destructive-foreground": [250, 250, 250, 255],
    "--border": [43, 55, 85, 255],
    "--input": [43, 55, 85, 255],
    "--ring": [102, 255, 219, 255],
  },
};

for (const theme of ["light", "dark"] as const) {
  test(`token contract: ${theme}`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto("/", { waitUntil: "networkidle" });
    await expect
      .poll(() =>
        page.evaluate(
          (t) => document.documentElement.classList.contains(t),
          theme,
        ),
      )
      .toBe(true);

    for (const [token, want] of Object.entries(EXPECTED[theme])) {
      const got = await sample8bit(page, `var(${token})`);
      expect(got, `${theme} ${token}`).toEqual(want);
    }
  });
}

test("alpha sites keep their colour and gain the right alpha", async ({
  page,
}) => {
  await setTheme(page, "light");
  await page.goto("/", { waitUntil: "networkidle" });

  // color-mix(in oklab, X p%, transparent) must equal X with alpha p.
  const got = await sample8bit(
    page,
    "color-mix(in oklab, var(--primary) 30%, transparent)",
  );
  expect(got.slice(0, 3)).toEqual([29, 211, 168]);
  expect(got[3]).toBeGreaterThanOrEqual(75);
  expect(got[3]).toBeLessThanOrEqual(78); // 0.3 * 255 = 76.5
});
```

- [x] **Step 6: Create `tests/visual/source-contract.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CSS = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");

test("no hsl(var(...)) call sites remain", () => {
  expect(CSS.match(/hsl\(\s*var\(/g)).toBeNull();
});

test("no channel-triplet colour tokens remain", () => {
  // e.g. "--background: 0 0% 100%"
  expect(CSS.match(/--[a-z-]+:\s*[\d.]+\s+[\d.]+%\s+[\d.]+%/g)).toBeNull();
});

test("the gamut-boundary gradient literal is deliberately untouched", () => {
  // hsl(166 100% 50%) cannot round-trip through OKLCH; see plan preamble.
  expect(CSS).toContain("hsl(166 100% 50%)");
});

test("all 16 alpha sites are color-mix with the right percentages", () => {
  const counts = new Map<string, number>([
    ["var(--muted-foreground) 30%", 2],
    ["var(--muted-foreground) 50%", 1],
    ["var(--primary) 10%", 1],
    ["var(--primary) 15%", 2],
    ["var(--primary) 20%", 2],
    ["var(--primary) 30%", 3],
    ["var(--primary) 50%", 2],
    ["var(--border) 50%", 2],
    ["var(--background) 80%", 1],
  ]);
  let total = 0;
  for (const [needle, want] of counts) {
    const found = CSS.split(needle).length - 1;
    expect(found, needle).toBe(want);
    total += found;
  }
  expect(total).toBe(16);
});

test("--accent-tint is preserved (no consumer, but token compat)", () => {
  expect(CSS).toMatch(/--accent-tint:\s*color-mix\(/);
});
```

- [x] **Step 7: Create `tests/visual/tokens.spec.ts` — screenshots (broad coverage only)**

```ts
import { test, expect } from "@playwright/test";
import { settle, freezeVisuals, setTheme } from "./helpers";

const WIDTHS = [375, 768, 1280] as const;

for (const theme of ["light", "dark"] as const) {
  for (const width of WIDTHS) {
    test(`screenshot: ${theme} @ ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await setTheme(page, theme);
      await page.goto("/", { waitUntil: "networkidle" });

      await expect
        .poll(() =>
          page.evaluate(
            (t) => document.documentElement.classList.contains(t),
            theme,
          ),
        )
        .toBe(true);

      await freezeVisuals(page);
      await settle(page);

      await expect(page).toHaveScreenshot(`tokens-${theme}-${width}.png`, {
        fullPage: true,
      });
    });
  }
}
```

- [x] **Step 8: Ignore Playwright output**

Append to `.gitignore`:

```
# playwright
/test-results/
/playwright-report/
/blob-report/
```

- [x] **Step 9: Clean-install gates**

```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci
npm run build
npx tsc --noEmit
npm run lint
```

All must exit 0. `tsc` typechecks `playwright.config.ts` and `tests/visual/**` because `tsconfig.json` includes `**/*.ts`.

- [x] **Step 10: Commit**

```bash
git add package.json package-lock.json playwright.config.ts tests/visual .gitignore
git commit -m "test: add token verification harness (pixel, source, screenshot layers)"
```

---

### Task 2: Baseline in a disposable worktree, and prove the harness fails

**Never capture a fidelity baseline from the working tree** — it can bless unrelated uncommitted work, and the revert step can destroy it.

**Files:** creates snapshots under `tests/visual/*-snapshots/`, copied in from the worktree.

**Interfaces:**
- Consumes: Task 1's harness, committed.
- Produces: committed baseline snapshots for the 6 screenshot cases.

- [x] **Step 1: Create a disposable worktree pinned to Task 1's commit**

```bash
cd /home/sagemaker-user/others/mydata/portfolio/jerilkuriakose.github.io
baseline_dir="$(mktemp -d /tmp/opencode/phase0-baseline.XXXXXX)"
echo "$baseline_dir" > /tmp/opencode/phase0-baseline-path
git worktree add "$baseline_dir" HEAD
```

- [x] **Step 2: Build and record snapshots inside the worktree**

```bash
baseline_dir="$(cat /tmp/opencode/phase0-baseline-path)"
cd "$baseline_dir"
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci
npm run build
npm run test:visual:update
```

- [x] **Step 3: Prove stability across repeats — one pass is not enough**

```bash
npm run test:visual -- --repeat-each=3
```

Expected: all pass. If anything flakes, **diagnose it** (fonts, Motion, images, server) — do **not** raise thresholds or regenerate snapshots to make it green. Record the smallest measured allowance only if flake is genuinely irreducible.

- [x] **Step 4: Prove the harness can FAIL**

Inside the worktree, temporarily change one token:

```bash
sed -i 's/--primary: 166 76% 47%;/--primary: 300 76% 47%;/' app/globals.css
npm run build
npm run test:visual || echo "GOOD - harness detects change"
```

Expected: failures in **both** `token-contract` and `screenshot` tests. A harness that cannot fail is worthless.

- [x] **Step 5: Revert inside the worktree only**

```bash
git restore app/globals.css
npm run build
npm run test:visual
```

Expected: all pass again.

- [x] **Step 6: Copy snapshots back to the main checkout**

```bash
main_dir=/home/sagemaker-user/others/mydata/portfolio/jerilkuriakose.github.io
baseline_dir="$(cat /tmp/opencode/phase0-baseline-path)"
cp -r "$baseline_dir"/tests/visual/*-snapshots "$main_dir"/tests/visual/
```

- [x] **Step 7: Remove the worktree cleanly**

```bash
cd /home/sagemaker-user/others/mydata/portfolio/jerilkuriakose.github.io
git -C "$(cat /tmp/opencode/phase0-baseline-path)" status --short
git worktree remove "$(cat /tmp/opencode/phase0-baseline-path)"
git worktree list
rm -f /tmp/opencode/phase0-baseline-path
```

`status --short` must be empty before removal. **Never use `--force`** — a dirty worktree means step 5 failed and must be investigated.

- [x] **Step 8: Commit the baseline**

```bash
git add tests/visual
git commit -m "test: record pre-migration baseline from pinned worktree"
```

---

### Task 3: Atomic OKLCH conversion

One commit. `hsl(oklch(…))` is invalid CSS, so renaming values in place requires tokens, `@theme inline` and call sites to move together. A dual-token migration (temporary `--primary-oklch` aliases, migrate groups, then rename) is *possible* but adds a temporarily doubled token graph and cleanup risk without reducing risk for one 389-line file — so it is deliberately not used.

**Files:** modify `app/globals.css`

**Interfaces:**
- Consumes: Task 2's committed baseline.
- Produces: `globals.css` where each colour token holds a complete `oklch(...)`, consumed as bare `var(--token)`.

- [x] **Step 1: Convert the `:root` token block**

```css
:root {
  --navy: oklch(0.206407 0.038822 265.5472);
  --navy-light: oklch(0.246364 0.044214 265.6513);
  --navy-lighter: oklch(0.287403 0.043441 265.9893);
  --slate: oklch(0.653819 0.029859 256.7816);
  --slate-light: oklch(0.731267 0.024129 255.1074);
  --lightest-slate: oklch(0.840359 0.013020 253.3208);
  --white: oklch(0.976673 0.001831 247.8405);

  --accent: oklch(0.908654 0.139721 174.8630);
  --accent-tint: color-mix(in oklab, oklch(0.908654 0.139721 174.8630) 10%, transparent);

  --background: oklch(1 0 0);
  --foreground: oklch(0.206407 0.038822 265.5472);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.206407 0.038822 265.5472);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.206407 0.038822 265.5472);
  --primary: oklch(0.773404 0.147474 170.8866);
  --primary-foreground: oklch(0.206407 0.038822 265.5472);
  --secondary: oklch(0.968435 0.006816 247.8951);
  --secondary-foreground: oklch(0.206407 0.038822 265.5472);
  --muted: oklch(0.968435 0.006816 247.8951);
  --muted-foreground: oklch(0.556392 0.039801 256.8166);
  --accent-bg: oklch(0.968435 0.006816 247.8951);
  --accent-foreground: oklch(0.206407 0.038822 265.5472);
  --destructive: oklch(0.635577 0.208196 25.3782);
  --destructive-foreground: oklch(0.9848 0 0);
  --border: oklch(0.925769 0.013209 255.0276);
  --input: oklch(0.925769 0.013209 255.0276);
  --ring: oklch(0.773404 0.147474 170.8866);
  --radius: 0.75rem;
}
```

- [x] **Step 2: Convert the `.dark` token block**

```css
.dark {
  --background: oklch(0.206407 0.038822 265.5472);
  --foreground: oklch(0.840359 0.013020 253.3208);
  --card: oklch(0.246364 0.044214 265.6513);
  --card-foreground: oklch(0.840359 0.013020 253.3208);
  --popover: oklch(0.246364 0.044214 265.6513);
  --popover-foreground: oklch(0.840359 0.013020 253.3208);
  --primary: oklch(0.908654 0.139721 174.8630);
  --primary-foreground: oklch(0.206407 0.038822 265.5472);
  --secondary: oklch(0.287403 0.043441 265.9893);
  --secondary-foreground: oklch(0.840359 0.013020 253.3208);
  --muted: oklch(0.287403 0.043441 265.9893);
  --muted-foreground: oklch(0.653819 0.029859 256.7816);
  --accent-bg: oklch(0.287403 0.043441 265.9893);
  --accent-foreground: oklch(0.840359 0.013020 253.3208);
  --destructive: oklch(0.399643 0.134794 25.7682);
  --destructive-foreground: oklch(0.9848 0 0);
  --border: oklch(0.341124 0.054741 265.8789);
  --input: oklch(0.341124 0.054741 265.8789);
  --ring: oklch(0.908654 0.139721 174.8630);
}
```

- [x] **Step 3: Unwrap `@theme inline`**

Colour mappings lose their `hsl()` wrapper. Leave `--radius-*`, `--font-*`, `--animate-*` untouched — not colours.

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);

  --font-sans: var(--font-inter), Inter, system-ui, sans-serif;
  --font-mono: var(--font-jetbrains-mono), "JetBrains Mono", monospace;

  --animate-fade-in: fade-in 0.5s ease-out forwards;
}
```

- [x] **Step 4: Convert the 33 plain call sites**

Mechanical: `hsl(var(--x))` → `var(--x)`.

- [x] **Step 5: Convert the 16 alpha call sites**

Use the multiplicity table above. **Do not touch line 203's `hsl(166 100% 50%)`** — it is a deliberate exception.

- [x] **Step 6: Static assertion — the only `hsl(` left is line 203**

```bash
grep -c 'hsl(var(' app/globals.css   # expect 0
grep -n 'hsl(' app/globals.css       # expect exactly one hit: the line-203 gradient stop
```

- [x] **Step 7: Run the full harness — the real test**

```bash
npm run build
npm run test:visual
```

Expected: **all pass** — token contract, source contract, and 6 screenshots. Any screenshot failure is a conversion defect: inspect `test-results/**/*-diff.png` and fix the call site. **Never update snapshots to make this pass.**

- [x] **Step 8: Remaining gates**

```bash
npx tsc --noEmit
npm run lint
```

- [x] **Step 9: Commit**

```bash
git add app/globals.css
git commit -m "refactor: convert colour tokens from HSL channels to OKLCH

Mechanical conversion at pixel-identical rendered output. L and C to 6
decimals, hue to 4: 4dp was measured to drift --primary by one 8-bit unit
(29->28 in red). The .gradient-text literal hsl(166 100% 50%) is left
unconverted - it sits on the sRGB gamut boundary and cannot round-trip
through OKLCH at any precision.

Alpha modifiers migrated to color-mix(in oklab, ...), which is provably
equivalent under premultiplied interpolation and has a safer support
floor than relative colour syntax.

Verified: per-token 8-bit canvas assertions in both themes, source
contract on all 16 alpha sites, and 6 zero-tolerance screenshots."
```

---

### Task 4: Post-conversion verification sweep

Verification only. **This task makes no commit.**

**Files:** verify only.

**Interfaces:**
- Consumes: converted `globals.css`.
- Produces: a clean bill of health for Phase 1.

- [x] **Step 1: No channel triplets, no stray `hsl(var(`**

```bash
grep -nE '^\s+--[a-z-]+:\s*[0-9.]+ [0-9.]+% [0-9.]+%' app/globals.css || echo CLEAN
grep -c 'hsl(var(' app/globals.css
```

Expected: `CLEAN`, then `0`.

- [x] **Step 2: No HSL anywhere in TSX (should already be true)**

```bash
grep -rn 'hsl(' app components --include='*.tsx' || echo CLEAN
```

Expected: `CLEAN`.

- [x] **Step 3: Full harness, repeated, to catch flake introduced by the change**

```bash
npm run build
npm run test:visual -- --repeat-each=3
```

Expected: all pass, three times.

- [x] **Step 4: Confirm clean tree**

```bash
git status --short
```

Expected: empty. If anything is unstaged, Task 3 step 9 missed a file.

---

## Self-Review

**1. Spec coverage.** Implements §15 Phase 0 fully: token conversion (Task 3 steps 1–2), `@theme inline` (step 3), all 49 call sites (steps 4–5), the precision requirement (empirically set to 6dp), the numeric diff budget (starts at literal zero, widened only on measured flake), old-baseline diffing scoped to Phase 0 (§14), and 375/768/1280 × light/dark (§14). The §14 requirement that baselines come from a worktree is honoured in Task 2. Phases 1–6 are out of scope.

**2. Placeholder scan.** No TBD/TODO. Every code step is complete and runnable. All 17 OKLCH values and all 46 expected 8-bit triplets are computed or measured, never estimated.

**3. Type consistency.** `setTheme`, `settle`, `freezeVisuals`, `sample8bit`, `Theme` are declared in Task 1 step 4 and used with those exact names and signatures in steps 5 and 7. `test:visual` / `test:visual:update` are defined in step 2 and used consistently in Tasks 2–4. Screenshot names `tokens-${theme}-${width}.png` are generated in one place only.

**4. Deliberate deviations from the reviewing model's advice, with reasons.**
- It asserted no 4dp value changes its 8-bit hex. **Measurement disproved this** for `--primary`; precision is 6dp.
- It proposed converting the gradient literal and asserting zero `hsl(`. **Measurement showed it cannot round-trip**; it is preserved, and a source-contract test now *asserts* it stays.
- It endorsed `color-mix(…, transparent)` as equivalent — accepted, with its premultiplication proof recorded above so a future reader does not "fix" it.

**5. Honest limitation.** Screenshots are broad coverage, not proof. They never exercise focus, hover, selection or scrollbar states, and `--accent-tint` has no consumer at all. The per-token contract test exists precisely because six screenshots cannot prove 49 replacements.

**6. Step granularity caveat.** The writing-plans skill asks for 2–5 minute steps. Most steps here meet that, but installing dependencies, authoring five harness files, and stabilising six full-page snapshots are genuinely longer. Task boundaries are still correct — each ends in one reviewable deliverable — but this plan does not claim every step is 2–5 minutes.
