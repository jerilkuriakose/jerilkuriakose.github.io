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
  // BlurFade entrances are staggered (~0.04s * index, then 0.4s each), so with
  // ~40 wrapped elements the last one finishes well after 1.5s. Measured: they
  // are still converging on y:-6 at 800ms.
  await page.waitForTimeout(3000);
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
