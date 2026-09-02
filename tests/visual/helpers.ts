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
    // Phase 5 added a `loading="lazy"` photo far below the fold. A lazy image
    // that has never been scrolled toward NEVER loads, so `i.complete` stays
    // false forever and awaiting it hangs - measured: settle() timed out at
    // 30s against the contact band. Skip images the browser is deliberately
    // not fetching yet, and cap the rest so one stalled request cannot wedge
    // the whole suite.
    const nearViewport = (i: HTMLImageElement) => {
      const r = i.getBoundingClientRect();
      return r.bottom > -window.innerHeight && r.top < window.innerHeight * 2;
    };
    const pending = Array.from(document.images).filter(
      (i) => !i.complete && (i.loading !== "lazy" || nearViewport(i)),
    );
    await Promise.race([
      Promise.all(
        pending.map(
          (i) =>
            new Promise<void>((res) => {
              i.addEventListener("load", () => res(), { once: true });
              i.addEventListener("error", () => res(), { once: true });
            }),
        ),
      ),
      new Promise<void>((res) => setTimeout(res, 8000)),
    ]);
  });
  // BlurFade entrances are staggered (~0.04s * index, then 0.4s each), so with
  // ~40 wrapped elements the last one finishes well after 1.5s. Measured: they
  // are still converging on y:-6 at 800ms.
  await page.waitForTimeout(3000);
}

/**
 * Wait until every declared photo has actually decoded.
 *
 * Needed because settle() deliberately does NOT block on offscreen lazy images,
 * so a contrast measurement taken straight after it could sample an empty box
 * and pass trivially. Call this after revealAll(), which is what triggers the
 * lazy fetch in the first place.
 */
export async function awaitPhotos(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>("img[data-photo]"));
    return imgs.length > 0 && imgs.every((i) => i.complete && i.naturalWidth > 0);
  });
}

/**
 * Headless SwiftShader renders large blur radii as concentric ring
 * artifacts - a rasterisation artifact, not a CSS bug - which makes
 * diffs meaningless. Also stop CSS animation and transitions.
 *
 * NOTE: this cannot stop Motion (framer-motion), which animates via JS by
 * writing inline transforms. Use lockMotion() after settle() for that.
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
 * Force every element to its untransformed position.
 *
 * Required because the hero scroll indicator uses Motion's
 * `animate={{ y: [0, 8, 0] }}` - an INFINITE loop that never settles, so
 * Playwright can never take two consecutive stable screenshots. CSS
 * `animation: none` does not stop it, because Motion drives inline transforms
 * from JS.
 *
 * Forcing `transform: none` is deterministic in a way that freezing the
 * current transform is not: a frozen loop lands at a random phase each run.
 * The only cost is that BlurFade's settled -6px offset disappears, which is
 * applied identically to baseline and post-conversion runs, so colour
 * equivalence - the only thing Phase 0 asserts - is unaffected.
 * (That -6px resting offset is itself a bug, slated for Phase 4.)
 */
export async function lockMotion(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `* { transform: none !important; }`,
  });
  await page.waitForTimeout(250);
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

/**
 * Trigger every scroll-linked reveal, then return to the top.
 *
 * Phase 4 made BlurFade observer-driven. The screenshot suite captures
 * `fullPage: true`, and `lockMotion()` sets `transform: none` but does NOT touch
 * opacity - so without this, every below-fold element would screenshot at
 * opacity 0 and the baseline would bake in invisible content, after which every
 * future run happily matches it.
 *
 * `useInView` is configured `{ once: true }`, so a single pass down the document
 * reveals everything permanently.
 */
export async function revealAll(page: Page): Promise<void> {
  const reached = await page.evaluate(async () => {
    // `html { scroll-behavior: smooth }` makes window.scrollTo ANIMATE, so each
    // call is interrupted by the next and the loop never arrives. Measured: a
    // loop requesting 8642px only ever reached 3338px, leaving Publications,
    // Education, Contact and the footer permanently unrevealed at opacity 0.
    // Force instant scrolling for the duration.
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";

    const height = Math.max(root.scrollHeight, document.body.scrollHeight);
    const step = Math.floor(window.innerHeight * 0.8);
    let deepest = 0;
    for (let y = 0; y <= height; y += step) {
      window.scrollTo({ top: Math.min(y, height), behavior: "instant" });
      // Yield across two animation frames so IntersectionObserver delivers
      // rather than coalescing; a bare setTimeout is not a contract.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise((r) => setTimeout(r, 90));
      deepest = Math.max(deepest, window.scrollY);
    }
    window.scrollTo({ top: height, behavior: "instant" });
    await new Promise((r) => setTimeout(r, 150));
    deepest = Math.max(deepest, window.scrollY);
    window.scrollTo({ top: 0, behavior: "instant" });
    root.style.scrollBehavior = previous;

    return { deepest, maxScroll: height - window.innerHeight };
  });

  // Fail loudly rather than baking blank sections into a baseline that every
  // future run then matches.
  if (reached.deepest < reached.maxScroll - 20) {
    throw new Error(
      `revealAll only reached ${reached.deepest}px of ${reached.maxScroll}px - ` +
        `content below that is still unrevealed`,
    );
  }

  await page.waitForTimeout(900);
}
