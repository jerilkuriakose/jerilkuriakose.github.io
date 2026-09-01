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
 * artifacts - a rasterisation artifact, not a CSS bug - which makes
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
