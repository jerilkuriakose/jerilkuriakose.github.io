import { test, expect, type Page } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DATA } from "../../data/resume";
import { resolveFeaturedMetrics } from "../../data/metrics";

/**
 * The social card - public/og.png, the image WhatsApp, LinkedIn and X show when
 * the URL is shared - is a committed PNG, so nothing in the build keeps it
 * current. The 2026-09-01 card was rendered once by hand and still read
 * "Principal Data Scientist" and "SDAIA" a month after the 2026-09-06 rebrand
 * had updated every text tag around it. Its only test checked the dimensions.
 *
 * This file is now the card's single source. It renders the card from DATA with
 * the site's own stylesheet, tokens and fonts, and FAILS unless public/og.png is
 * pixel-identical to that render. Change a card field in DATA and this goes red
 * until the card is regenerated:
 *
 *   npm run og:update        (builds, then rewrites public/og.png)
 *
 * Card fields: DATA.title, DATA.name, DATA.tagline, DATA.featuredMetricIds and
 * their metrics, and the current role DATA.work[0] (company + city).
 */

const OG = join(process.cwd(), "public/og.png");
const HOST = "jerilkuriakose.github.io";
const W = 1200;
const H = 630;
const UPDATE = process.env.OG_UPDATE === "1";

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function cardHtml(head: string, htmlClass: string): string {
  const current = DATA.work[0];
  // "Senior Principal Engineer (Gen AI)" -> "Senior Principal Engineer · Gen AI"
  const eyebrow = DATA.title.replace(/\s*\(([^)]+)\)\s*$/, " · $1");
  const city = current.location.split(",")[0];
  const metrics = resolveFeaturedMetrics(DATA)
    .map(
      (m) =>
        `<div class="metric"><div class="value line">${esc(m.value)}</div><div class="label line">${esc(m.label)}</div></div>`,
    )
    .join("");

  return `<!doctype html>
<html class="${esc(htmlClass)}"><head><meta charset="utf-8">${head}<style>
  html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; }
  body { background: var(--canvas); color: var(--ink); -webkit-font-smoothing: antialiased; }
  .card {
    position: relative; box-sizing: border-box; width: ${W}px; height: ${H}px;
    padding: 132px 85px 0; display: flex; flex-direction: column;
    background:
      radial-gradient(circle at 6% 4%, color-mix(in oklch, var(--brand-vivid) 42%, transparent), transparent 40%),
      radial-gradient(circle at 96% 104%, color-mix(in oklch, var(--surface-muted) 85%, transparent), transparent 44%),
      var(--canvas);
  }
  .line { white-space: nowrap; overflow: hidden; }
  .eyebrow { font-family: var(--font-mono); font-size: 19px; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--interactive); }
  .name { font-family: var(--font-display); font-size: 100px; font-weight: 600;
    letter-spacing: -0.02em; line-height: 1.05; margin-top: 8px; }
  .tagline { font-family: var(--font-display); font-size: 44px; font-weight: 600;
    letter-spacing: -0.01em; color: var(--display-accent); margin-top: 2px; }
  .rule { width: 96px; height: 3px; background: var(--brand-vivid); margin: 30px 0 26px; }
  .metrics { display: flex; gap: 86px; }
  .value { font-family: var(--font-mono); font-size: 38px; font-weight: 500; }
  .label { font-family: var(--font-sans); font-size: 19px; color: var(--ink-muted); margin-top: 6px; }
  .footer { position: absolute; left: 85px; right: 85px; bottom: 44px; display: flex;
    justify-content: space-between; font-family: var(--font-mono); font-size: 17px;
    color: var(--ink-muted); }
</style></head>
<body><div class="card">
  <div class="eyebrow line">${esc(eyebrow)}</div>
  <div class="name line">${esc(DATA.name)}</div>
  <div class="tagline line">${esc(DATA.tagline)}</div>
  <div class="rule"></div>
  <div class="metrics">${metrics}</div>
  <div class="footer"><span class="line">${esc(`${current.company} · ${city}`)}</span><span class="line">${HOST}</span></div>
</div></body></html>`;
}

/** Render the card with the BUILT site's CSS and fonts, served by the harness. */
async function renderCard(page: Page): Promise<Buffer> {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.setViewportSize({ width: W, height: H });
  const res = await page.goto("/", { waitUntil: "load" });
  expect(res?.status(), "the site must be served").toBe(200);

  // The site's stylesheets carry the tokens and next/font's @font-face rules; the
  // font-variable classes live on <html> (see app/layout.tsx for why not <body>).
  // The theme class is dropped so the card is always the light theme.
  const { head, htmlClass } = await page.evaluate(() => ({
    head: Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join(""),
    htmlClass: Array.from(document.documentElement.classList)
      .filter((c) => c !== "dark" && c !== "light")
      .join(" "),
  }));
  expect(head, "the built page must link a stylesheet").toContain("stylesheet");

  // Same origin as the site, so its relative CSS and font URLs resolve.
  await page.route("**/__og-card", (route) =>
    route.fulfill({ contentType: "text/html", body: cardHtml(head, htmlClass) }),
  );
  await page.goto("/__og-card", { waitUntil: "load" });

  // A card rendered in a fallback face would still be a valid PNG; refuse it.
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    const root = getComputedStyle(document.documentElement);
    return ["--font-newsreader", "--font-jetbrains-mono", "--font-inter"].map((v) => {
      const family = root.getPropertyValue(v).split(",")[0].trim().replace(/['"]/g, "");
      const loaded = Array.from(document.fonts).some(
        (f) => f.family.replace(/['"]/g, "") === family && f.status === "loaded",
      );
      return { v, family, loaded };
    });
  });
  for (const f of fonts) expect(f.loaded, `${f.v} (${f.family || "unset"}) must load`).toBe(true);

  // A longer title or company must not be silently clipped off the card.
  const clipped = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>(".line"))
      .filter((el) => el.scrollWidth > el.clientWidth)
      .map((el) => el.textContent),
  );
  expect(clipped, `card text that does not fit: ${clipped.join(" | ")}`).toEqual([]);

  return page.screenshot({ scale: "css", animations: "disabled" });
}

test("public/og.png is exactly the card DATA renders today", async ({ page }) => {
  expect(DATA.work[0].end, "the card reads the current role from work[0]").toBe("Present");

  const fresh = await renderCard(page);
  expect(fresh.readUInt32BE(16), "rendered width").toBe(W);
  expect(fresh.readUInt32BE(20), "rendered height").toBe(H);
  // WhatsApp is widely reported (not documented) to drop a preview image over
  // ~300 KB. The 2026-10 card is ~264 KB, so heavier gradients can cross it.
  expect(fresh.length, "og.png must stay under ~300 KB or WhatsApp may drop it").toBeLessThan(300_000);

  if (UPDATE) writeFileSync(OG, fresh);
  const committed = readFileSync(OG);

  // Decode both PNGs in the browser and count differing pixels, so a PNG encoder
  // change cannot fail this while the pixels are identical.
  const diff = await page.evaluate(
    async ([a, b]) => {
      const load = async (b64: string) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, c.width, c.height);
      };
      const [x, y] = await Promise.all([load(a), load(b)]);
      if (x.width !== y.width || x.height !== y.height) return -1;
      let n = 0;
      for (let i = 0; i < x.data.length; i += 4) {
        if (
          x.data[i] !== y.data[i] ||
          x.data[i + 1] !== y.data[i + 1] ||
          x.data[i + 2] !== y.data[i + 2] ||
          x.data[i + 3] !== y.data[i + 3]
        )
          n++;
      }
      return n;
    },
    [fresh.toString("base64"), committed.toString("base64")] as const,
  );

  expect(
    diff,
    "public/og.png is stale: it differs from the card DATA renders now " +
      `(${diff === -1 ? "size mismatch" : `${diff} pixels`}). Regenerate: npm run og:update`,
  ).toBe(0);
});
