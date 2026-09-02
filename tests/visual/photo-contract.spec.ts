import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { HERO_PHOTO, CONTACT_PHOTO, PHOTOS, srcSetFor } from "@/data/media";
import { awaitPhotos, sample8bit, setTheme, settle, revealAll, type Theme } from "./helpers";

/**
 * Read the CSS actually shipped to browsers.
 *
 * Required because Chromium's CSSOM ALIASES `-webkit-backdrop-filter` onto the
 * standard property: `rule.style.cssText` reports `backdrop-filter` only, even
 * when both are authored. A CSSOM-based check for the prefix can therefore
 * never fail, which makes it worthless. The built stylesheet is the artifact
 * the rule is actually about.
 */
function builtCss(): string {
  const dir = join(process.cwd(), "out", "_next", "static", "chunks");
  if (!existsSync(dir)) throw new Error(`no build output at ${dir} - run next build first`);
  const files = readdirSync(dir).filter((f) => f.endsWith(".css"));
  if (files.length === 0) throw new Error(`no .css chunk in ${dir}`);
  return files.map((f) => readFileSync(join(dir, f), "utf8")).join("\n");
}

/**
 * Phase 5 photography + glass contract (spec §6).
 *
 * DELIBERATELY does not call freezeVisuals(). That helper injects
 * `* { filter: none !important; }` (helpers.ts:50), which would strip the
 * saturate() that §6 requires contrast be measured AFTER. Every measurement
 * here runs on the real composite.
 *
 * The recurring failure across six phases has been a gate that proves nothing,
 * so each assertion below names the escape it closes.
 */

const THEMES: Theme[] = ["light", "dark"];

/** Sections §6 forbids photography behind, by id. */
const NO_PHOTO_SECTIONS = ["skills", "publications", "education-awards"];

type Box = { x: number; y: number; width: number; height: number };

const intersects = (a: Box, b: Box): boolean =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

// ---------------------------------------------------------------------------
// Region accounting
// ---------------------------------------------------------------------------

test("at most two photo regions, and every rendered photo is declared", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await revealAll(page);

  expect(await page.locator(".photo-region").count()).toBe(2);
  expect(PHOTOS.length).toBe(2);

  // Escape closed: an <img> added without data-photo, or a CSS
  // background-image, would not be counted by a `.photo-region` query. Assert
  // from the other direction - every raster the page paints is accounted for.
  const undeclared = await page.evaluate(() => {
    const declaredPortraitAlt = document.querySelector<HTMLImageElement>(
      "section#hero img:not([data-photo])",
    );
    const out: string[] = [];
    for (const img of Array.from(document.images)) {
      if (img.dataset.photo) continue;
      if (img === declaredPortraitAlt) continue; // the portrait, not photography
      out.push(`img ${img.currentSrc || img.src}`);
    }
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
      const bg = getComputedStyle(el).backgroundImage;
      if (/url\(/i.test(bg) && /\.(png|jpe?g|webp|avif)/i.test(bg)) {
        out.push(`background-image on ${el.tagName.toLowerCase()}: ${bg}`);
      }
    }
    return out;
  });
  expect(undeclared, "undeclared raster sources").toEqual([]);

  const ids = await page.locator("[data-photo]").evaluateAll((els) =>
    els.map((e) => (e as HTMLElement).dataset.photo),
  );
  expect([...ids].sort()).toEqual([CONTACT_PHOTO.id, HERO_PHOTO.id].sort());
});

test("no photography is geometrically behind the metric row or the text-only sections", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await revealAll(page);

  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(300);

    const result = await page.evaluate((forbiddenIds) => {
      const abs = (el: Element) => {
        const r = el.getBoundingClientRect();
        return {
          x: r.x + window.scrollX,
          y: r.y + window.scrollY,
          width: r.width,
          height: r.height,
        };
      };
      const regions = Array.from(document.querySelectorAll(".photo-region")).map(abs);
      const targets: { name: string; box: ReturnType<typeof abs> }[] = [];

      const proof = document.querySelector("[data-proof-row]");
      if (proof) targets.push({ name: "metric row", box: abs(proof) });
      for (const id of forbiddenIds) {
        const s = document.getElementById(id);
        if (s) targets.push({ name: `section#${id}`, box: abs(s) });
      }
      return { regions, targets, foundProof: Boolean(proof) };
    }, NO_PHOTO_SECTIONS);

    // The metric row must actually have been found, or this test is vacuous.
    expect(result.foundProof, "metric row locator resolved").toBe(true);
    expect(result.targets.length).toBe(NO_PHOTO_SECTIONS.length + 1);

    // Escape closed: DOM ancestry does NOT prove a sibling photo is not behind
    // an element - Phase 2 shipped exactly that bug, where a sibling deep panel
    // overlapped the content column by 140px. Compare rendered rectangles.
    for (const target of result.targets) {
      for (const region of result.regions) {
        expect(
          intersects(region, target.box),
          `photo region overlaps ${target.name} at ${width}px`,
        ).toBe(false);
      }
    }
  }
});

test("the two photo regions are never simultaneously visible, at ANY scroll position", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await revealAll(page);

  // Escape closed: sampling a handful of scroll offsets cannot prove a claim
  // about every offset. Compute each region's visibility INTERVAL in scroll
  // coordinates and prove the reachable intervals are disjoint.
  const intervals = await page.evaluate(() => {
    const vh = window.innerHeight;
    const maxScroll = Math.max(
      0,
      Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - vh,
    );
    return {
      maxScroll,
      spans: Array.from(document.querySelectorAll(".photo-region")).map((el) => {
        const r = el.getBoundingClientRect();
        const top = r.top + window.scrollY;
        const bottom = r.bottom + window.scrollY;
        return {
          enter: Math.max(0, Math.min(maxScroll, top - vh)),
          exit: Math.max(0, Math.min(maxScroll, bottom)),
        };
      }),
    };
  });

  const spans = [...intervals.spans].sort((a, b) => a.enter - b.enter);
  expect(spans.length).toBe(2);
  expect(
    spans[1].enter >= spans[0].exit,
    `reachable visibility intervals overlap: ${JSON.stringify(spans)}`,
  ).toBe(true);
});

// ---------------------------------------------------------------------------
// Composite contrast - the real pixels, after saturate()
// ---------------------------------------------------------------------------

for (const theme of THEMES) {
  test(`every text run over a photo clears 4.5:1 against its WORST backdrop pixel (${theme})`, async ({
    page,
  }) => {
    await setTheme(page, theme);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    // revealAll BEFORE settle: it is the scroll pass that triggers the lazy
    // contact photo's fetch. awaitPhotos then proves both photos decoded, so a
    // measurement cannot pass by sampling an empty box.
    await revealAll(page);
    await settle(page);
    await awaitPhotos(page);

    // Find leaf text elements whose rendered box overlaps a photo region.
    const overThePhoto = await page.evaluate(() => {
      const abs = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height };
      };
      const hit = (a: ReturnType<typeof abs>, b: ReturnType<typeof abs>) =>
        a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

      const regions = Array.from(document.querySelectorAll(".photo-region")).map(abs);
      const out: { selector: string; colour: string; text: string; fontPx: number; bold: boolean }[] = [];
      let n = 0;

      for (const el of Array.from(document.querySelectorAll<HTMLElement>("main *"))) {
        // Leaf-ish: has a direct non-empty text node.
        const own = Array.from(el.childNodes).some(
          (c) => c.nodeType === Node.TEXT_NODE && (c.textContent ?? "").trim().length > 0,
        );
        if (!own) continue;
        const box = abs(el);
        if (box.width < 2 || box.height < 2) continue;
        if (!regions.some((r) => hit(box, r))) continue;

        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.opacity === "0") continue;
        const marker = `photo-probe-${n++}`;
        el.setAttribute("data-photo-probe", marker);
        out.push({
          selector: `[data-photo-probe="${marker}"]`,
          colour: cs.color,
          text: (el.textContent ?? "").trim().slice(0, 40),
          fontPx: parseFloat(cs.fontSize),
          bold: parseInt(cs.fontWeight, 10) >= 700,
        });
      }
      return out;
    });

    // Vacuity guard: if nothing sits over a photo this test asserts nothing.
    // The hero badge alone guarantees at least one run.
    expect(overThePhoto.length, "text runs found over photography").toBeGreaterThan(0);

    // Make text invisible WITHOUT changing layout, so an element screenshot
    // yields the pure backdrop. Escape closed: sampling "under a text run"
    // without this hits glyph pixels and measures the text against itself.
    await page.addStyleTag({
      content: `[data-photo-probe] { color: transparent !important; text-shadow: none !important; }`,
    });

    for (const probe of overThePhoto) {
      const [tr, tg, tb] = await sample8bit(page, probe.colour);
      const shot = await page.locator(probe.selector).screenshot({ scale: "css" });

      const worst = await page.evaluate(
        async ({ b64, text }) => {
          const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
          const bmp = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
          const cv = document.createElement("canvas");
          cv.width = bmp.width;
          cv.height = bmp.height;
          const ctx = cv.getContext("2d", { willReadFrequently: true });
          if (!ctx) throw new Error("2D canvas unavailable");
          ctx.drawImage(bmp, 0, 0);
          const d = ctx.getImageData(0, 0, bmp.width, bmp.height).data;

          const lin = (c: number) => {
            const s = c / 255;
            return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
          };
          const lum = (r: number, g: number, b: number) =>
            0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
          const ratio = (a: number, b: number) =>
            (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

          const tl = lum(text[0], text[1], text[2]);
          let low = Infinity;
          let at = [0, 0, 0];
          for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] === 0) continue;
            const r = ratio(tl, lum(d[i], d[i + 1], d[i + 2]));
            if (r < low) {
              low = r;
              at = [d[i], d[i + 1], d[i + 2]];
            }
          }
          return { low, at, px: bmp.width * bmp.height };
        },
        { b64: shot.toString("base64"), text: [tr, tg, tb] },
      );

      // Escape closed: a MEAN backdrop passes while a headline crosses the
      // bright plume. The worst pixel is the only honest measure.
      const large = probe.fontPx >= 24 || (probe.fontPx >= 18.66 && probe.bold);
      const floor = large ? 3 : 4.5;
      expect(
        worst.low,
        `"${probe.text}" (${theme}, ${probe.fontPx}px${probe.bold ? " bold" : ""}) ` +
          `worst backdrop rgb(${worst.at.join(",")}) over ${worst.px}px`,
      ).toBeGreaterThanOrEqual(floor);
    }
  });
}

// ---------------------------------------------------------------------------
// Glass polarity
// ---------------------------------------------------------------------------

test("glass polarity: near-opaque base OUTSIDE @supports, translucent + both filters INSIDE", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });

  // Escape closed: `backdrop-filter: none` cannot emulate missing support -
  // @supports still MATCHES, so the enhancement stays active and a
  // fallback-shaped test proves nothing. Inspect the cascade structurally.
  const shape = await page.evaluate(() => {
    const base: string[] = [];
    const gated: string[] = [];

    const walk = (rules: CSSRuleList, insideSupports: boolean) => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSSupportsRule) {
          walk(rule.cssRules, insideSupports || /backdrop-filter/i.test(rule.conditionText));
          continue;
        }
        if (rule instanceof CSSMediaRule || rule instanceof CSSLayerBlockRule) {
          walk(rule.cssRules, insideSupports);
          continue;
        }
        if (!(rule instanceof CSSStyleRule)) continue;
        if (!/(^|,|\s)\.glass(\s|,|$|:)/.test(rule.selectorText)) continue;

        // Prefix presence is deliberately NOT tracked here - see the raw-CSS
        // assertions below for why the CSSOM cannot answer that question.
        (insideSupports ? gated : base).push(rule.style.cssText);
      }
    };

    for (const sheet of Array.from(document.styleSheets)) {
      try {
        walk(sheet.cssRules, false);
      } catch {
        /* cross-origin sheet, none expected */
      }
    }
    return { base, gated };
  });

  expect(shape.base.length, "a .glass rule outside @supports must exist").toBeGreaterThan(0);
  expect(shape.gated.length, "a .glass rule inside @supports must exist").toBeGreaterThan(0);

  const baseCss = shape.base.join(" ");
  const gatedCss = shape.gated.join(" ");

  // The base rule is the fallback: near-opaque, and no filter at all.
  expect(baseCss, "base .glass must use --glass-solid").toMatch(/--glass-solid/);
  expect(baseCss, "base .glass must not carry backdrop-filter").not.toMatch(/backdrop-filter/i);
  expect(baseCss, "base .glass must not be the translucent value").not.toMatch(
    /--glass-translucent/,
  );

  // The enhancement carries the translucency AND the blur, together.
  expect(gatedCss).toMatch(/--glass-translucent/);

  // Both prefixes, in the SAME rule, asserted against the SHIPPED CSS.
  //
  // Chromium aliases -webkit-backdrop-filter onto backdrop-filter in the CSSOM,
  // so `rule.style.cssText` reports the standard property only and a
  // CSSOM-based prefix check can never fail - it would pass even if the prefix
  // were deleted. Measured: gatedHasWebkit came back false with BOTH properties
  // correctly authored. The raw stylesheet is the only honest source.
  const raw = builtCss();
  const gatedBlock = raw.match(/@supports[^{]*backdrop-filter[^{]*\{\s*\.glass\s*\{([^}]*)\}/);
  expect(gatedBlock, "a gated .glass block must exist in the built CSS").toBeTruthy();
  const gatedBody = gatedBlock![1];
  expect(gatedBody, "-webkit-backdrop-filter in the gated rule").toMatch(
    /-webkit-backdrop-filter\s*:/,
  );
  // Escape closed: a source-presence check is satisfied by finding the two
  // properties in unrelated rules, which would ship a one-engine-only surface.
  // Anchoring on the captured rule body proves co-location.
  expect(gatedBody, "standard backdrop-filter in the SAME rule").toMatch(
    /(?:^|[^-])backdrop-filter\s*:/,
  );
  expect(gatedBody, "§6 requires saturate() alongside blur").toMatch(/saturate\(/);
  expect(gatedBody, "the enhancement carries the translucent fill").toMatch(
    /--glass-translucent/,
  );
});

for (const theme of THEMES) {
  test(`the near-opaque base alpha is >= 0.90 and the enhancement is genuinely translucent (${theme})`, async ({
    page,
  }) => {
    await setTheme(page, theme);
    await page.goto("/", { waitUntil: "networkidle" });

    // Measured from REAL PIXELS, not by parsing the token string.
    //
    // The build downlevels oklch() into a hex pair PLUS a lab() override, and
    // the lab() form wins in Chromium. getComputedStyle then reports
    // `lab(19.2919% -13.1826 1.15042/.94)`, which no rgba() regex matches -
    // measured: the parse returned null for both tokens while the CSS was
    // entirely correct. Compositing the token over known black and white
    // backdrops and reading the bytes back recovers alpha regardless of which
    // colour syntax survived the build:
    //   over white: c_w = a*C + (1-a)*255
    //   over black: c_b = a*C
    //   => a = 1 - (c_w - c_b)/255
    const probeBoxes = await page.evaluate(() => {
      const host = document.createElement("div");
      host.id = "alpha-probe-host";
      host.style.cssText =
        "position:fixed;top:0;left:0;z-index:2147483647;display:flex;isolation:isolate";
      const make = (token: string, backdrop: string, id: string) => {
        const outer = document.createElement("div");
        outer.style.cssText = `width:40px;height:40px;background:${backdrop}`;
        const inner = document.createElement("div");
        inner.id = id;
        inner.style.cssText = `width:100%;height:100%;background:var(${token})`;
        outer.appendChild(inner);
        return outer;
      };
      host.append(
        make("--glass-solid", "#ffffff", "probe-solid-white"),
        make("--glass-solid", "#000000", "probe-solid-black"),
        make("--glass-translucent", "#ffffff", "probe-trans-white"),
        make("--glass-translucent", "#000000", "probe-trans-black"),
      );
      document.body.appendChild(host);
      return true;
    });
    expect(probeBoxes).toBe(true);

    const readBytes = async (id: string): Promise<number[]> => {
      const shot = await page.locator(`#${id}`).screenshot({ scale: "css" });
      return page.evaluate(async (b64) => {
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const bmp = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
        const cv = document.createElement("canvas");
        cv.width = bmp.width;
        cv.height = bmp.height;
        const ctx = cv.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("2D canvas unavailable");
        ctx.drawImage(bmp, 0, 0);
        const cx = Math.floor(bmp.width / 2);
        const cy = Math.floor(bmp.height / 2);
        return Array.from(ctx.getImageData(cx, cy, 1, 1).data).slice(0, 3);
      }, shot.toString("base64"));
    };

    const alphaOf = async (whiteId: string, blackId: string): Promise<number> => {
      const w = await readBytes(whiteId);
      const b = await readBytes(blackId);
      // Average the three channels; each yields the same alpha up to rounding.
      const per = [0, 1, 2].map((i) => 1 - (w[i] - b[i]) / 255);
      return per.reduce((a, c) => a + c, 0) / 3;
    };

    const solidAlpha = await alphaOf("probe-solid-white", "probe-solid-black");
    const transAlpha = await alphaOf("probe-trans-white", "probe-trans-black");

    await page.evaluate(() => document.getElementById("alpha-probe-host")?.remove());

    expect(solidAlpha, `base fill alpha measured ${solidAlpha.toFixed(3)}`).toBeGreaterThanOrEqual(
      0.9,
    );
    expect(
      transAlpha,
      `enhancement alpha measured ${transAlpha.toFixed(3)}`,
    ).toBeLessThan(0.9);
    // The two must be genuinely different, or the polarity is cosmetic.
    expect(solidAlpha - transAlpha, "base and enhancement alpha differ").toBeGreaterThan(0.1);
  });
}

for (const theme of THEMES) {
  test(`with the @supports enhancement REMOVED, glass text still clears 4.5:1 (${theme})`, async ({
    page,
  }) => {
    await setTheme(page, theme);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    // revealAll BEFORE settle: it is the scroll pass that triggers the lazy
    // contact photo's fetch. awaitPhotos then proves both photos decoded, so a
    // measurement cannot pass by sampling an empty box.
    await revealAll(page);
    await settle(page);
    await awaitPhotos(page);

    // Genuinely delete the gated .glass rule from the CSSOM, so the base rule
    // is what actually applies. This is the only way to exercise the fallback
    // in a browser that supports backdrop-filter.
    const removed = await page.evaluate(() => {
      let count = 0;
      const walk = (parent: CSSGroupingRule | CSSStyleSheet, gated: boolean) => {
        const rules = parent.cssRules;
        for (let i = rules.length - 1; i >= 0; i--) {
          const rule = rules[i];
          if (rule instanceof CSSSupportsRule) {
            walk(rule, gated || /backdrop-filter/i.test(rule.conditionText));
            continue;
          }
          if (rule instanceof CSSMediaRule || rule instanceof CSSLayerBlockRule) {
            walk(rule, gated);
            continue;
          }
          if (
            gated &&
            rule instanceof CSSStyleRule &&
            /(^|,|\s)\.glass(\s|,|$|:)/.test(rule.selectorText)
          ) {
            parent.deleteRule(i);
            count++;
          }
        }
      };
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          walk(sheet, false);
        } catch {
          /* ignore */
        }
      }
      return count;
    });
    expect(removed, "the gated .glass rule was actually removed").toBeGreaterThan(0);

    // Prove the removal took effect on the rendered element, not just in the
    // CSSOM: the surface must no longer report a backdrop-filter.
    const glass = page.locator(".glass").first();
    await expect(glass).toHaveCount(1);
    const filterNow = await glass.evaluate(
      (el) =>
        getComputedStyle(el).backdropFilter ||
        getComputedStyle(el).getPropertyValue("-webkit-backdrop-filter"),
    );
    expect(["none", ""], `backdrop-filter after removal: ${filterNow}`).toContain(filterNow);

    // Now measure the text on that fallback surface.
    const probes = await glass.evaluate((root) => {
      const out: { selector: string; colour: string; text: string; fontPx: number; bold: boolean }[] = [];
      let n = 0;
      for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
        const own = Array.from(el.childNodes).some(
          (c) => c.nodeType === Node.TEXT_NODE && (c.textContent ?? "").trim().length > 0,
        );
        if (!own) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.opacity === "0") continue;
        const marker = `glass-probe-${n++}`;
        el.setAttribute("data-glass-probe", marker);
        out.push({
          selector: `[data-glass-probe="${marker}"]`,
          colour: cs.color,
          text: (el.textContent ?? "").trim().slice(0, 40),
          fontPx: parseFloat(cs.fontSize),
          bold: parseInt(cs.fontWeight, 10) >= 700,
        });
      }
      return out;
    });
    expect(probes.length, "text runs found on the glass surface").toBeGreaterThan(0);

    await page.addStyleTag({
      content: `[data-glass-probe] { color: transparent !important; text-shadow: none !important; }`,
    });

    for (const probe of probes) {
      const [tr, tg, tb] = await sample8bit(page, probe.colour);
      const shot = await page.locator(probe.selector).screenshot({ scale: "css" });
      const worst = await page.evaluate(
        async ({ b64, text }) => {
          const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
          const bmp = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
          const cv = document.createElement("canvas");
          cv.width = bmp.width;
          cv.height = bmp.height;
          const ctx = cv.getContext("2d", { willReadFrequently: true });
          if (!ctx) throw new Error("2D canvas unavailable");
          ctx.drawImage(bmp, 0, 0);
          const d = ctx.getImageData(0, 0, bmp.width, bmp.height).data;
          const lin = (c: number) => {
            const s = c / 255;
            return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
          };
          const lum = (r: number, g: number, b: number) =>
            0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
          const ratio = (a: number, b: number) =>
            (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
          const tl = lum(text[0], text[1], text[2]);
          let low = Infinity;
          let at = [0, 0, 0];
          for (let i = 0; i < d.length; i += 4) {
            if (d[i + 3] === 0) continue;
            const r = ratio(tl, lum(d[i], d[i + 1], d[i + 2]));
            if (r < low) {
              low = r;
              at = [d[i], d[i + 1], d[i + 2]];
            }
          }
          return { low, at };
        },
        { b64: shot.toString("base64"), text: [tr, tg, tb] },
      );
      const large = probe.fontPx >= 24 || (probe.fontPx >= 18.66 && probe.bold);
      expect(
        worst.low,
        `fallback "${probe.text}" (${theme}) worst rgb(${worst.at.join(",")})`,
      ).toBeGreaterThanOrEqual(large ? 3 : 4.5);
    }
  });
}

// ---------------------------------------------------------------------------
// The six hard rules
// ---------------------------------------------------------------------------

test("blur is confined to bounded regions: one layer per stack, never nested, never a scroll container", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/", { waitUntil: "networkidle" });
  await revealAll(page);

  const found = await page.evaluate(() => {
    const out: {
      tag: string;
      cls: string;
      depth: number;
      containedByFixed: boolean;
      isScrollContainer: boolean;
      overlapsPhoto: boolean;
      viewportShare: number;
    }[] = [];

    const abs = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height };
    };
    const hit = (a: ReturnType<typeof abs>, b: ReturnType<typeof abs>) =>
      a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    const regions = Array.from(document.querySelectorAll(".photo-region")).map(abs);
    const viewportArea = window.innerWidth * window.innerHeight;

    for (const el of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
      const cs = getComputedStyle(el);
      const bf = cs.backdropFilter || cs.getPropertyValue("-webkit-backdrop-filter");
      if (!bf || bf === "none") continue;

      // Escape closed: computed styles, not source text - a utility class or a
      // cascade win is invisible to a grep over TSX.
      let depth = 0;
      let containedByFixed = false;
      for (let p = el.parentElement; p; p = p.parentElement) {
        const pcs = getComputedStyle(p);
        const pbf = pcs.backdropFilter || pcs.getPropertyValue("-webkit-backdrop-filter");
        if (pbf && pbf !== "none") depth++;
        if (pcs.position === "fixed" || pcs.position === "sticky") containedByFixed = true;
      }

      const box = abs(el);
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: el.className?.toString().slice(0, 60) ?? "",
        depth,
        containedByFixed,
        isScrollContainer: /(auto|scroll)/.test(`${cs.overflowX} ${cs.overflowY}`),
        overlapsPhoto: regions.some((r) => hit(box, r)),
        viewportShare: (box.width * box.height) / viewportArea,
      });
    }
    return out;
  });

  expect(found.length, "at least one glass surface must exist").toBeGreaterThan(0);

  for (const el of found) {
    const id = `${el.tag}.${el.cls}`;
    expect(el.depth, `nested backdrop-filter on ${id}`).toBe(0);

    // §6 hard rule 2 quotes "apply backdrop-blur only to fixed or sticky
    // elements", but §6 ALSO sanctions "glass cards ... where they overlap a
    // photography band" and states the point is that this "confines blur to
    // bounded regions". A glass card over a photo band necessarily scrolls, so
    // the literal fixed/sticky reading would forbid the very pattern the same
    // section prescribes. The binding constraint is the one §6 states as its
    // rationale: blur must stay BOUNDED.
    expect(
      el.containedByFixed || el.overlapsPhoto,
      `${id} is blurred but is neither fixed/sticky chrome nor over a photo band`,
    ).toBe(true);

    // "Never blur a LARGE scrolling container": not a scroller itself, and not
    // a large content area.
    expect(el.isScrollContainer, `${id} is blurred AND is a scroll container`).toBe(false);
    if (!el.containedByFixed) {
      expect(
        el.viewportShare,
        `${id} covers ${(el.viewportShare * 100).toFixed(0)}% of the viewport - too large to blur`,
      ).toBeLessThan(0.5);
    }
  }
});

test("nothing that actually carries a filter can animate or transition it", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await revealAll(page);

  // Scanning stylesheet rules for `transition-property: filter` produces FALSE
  // POSITIVES, not proof: Tailwind's own `.transition` utility lists
  // `filter, -webkit-backdrop-filter, backdrop-filter` among its properties and
  // `.transition-all` uses `all`, so both exist in the sheet whether or not any
  // element uses them. Measured: 6 such rules, none of them a real defect.
  //
  // §6's rule is about what ANIMATES, so it is asserted against elements that
  // actually carry a filter - where transitioning it would in fact cost a
  // per-frame backdrop copy.
  const offenders = await page.evaluate(() => {
    const bad: string[] = [];

    // Keyframes that touch filter/mask, indexed by name.
    const filterKeyframes = new Set<string>();
    const walk = (rules: CSSRuleList) => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSKeyframesRule) {
          for (const kf of Array.from(rule.cssRules)) {
            if (kf instanceof CSSKeyframeRule) {
              const css = kf.style.cssText;
              if (/(^|[^-])(filter|mask|mask-image)\s*:/i.test(css) || /backdrop-filter\s*:/i.test(css)) {
                filterKeyframes.add(rule.name);
              }
            }
          }
          continue;
        }
        if (rule instanceof CSSGroupingRule) walk(rule.cssRules);
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        walk(sheet.cssRules);
      } catch {
        /* ignore */
      }
    }

    const TRANSITIONS_FILTER =
      /(^|[\s,])(filter|backdrop-filter|-webkit-backdrop-filter|mask|mask-image|all)(\s|,|$)/i;

    for (const el of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
      const cs = getComputedStyle(el);
      const bf = cs.backdropFilter || cs.getPropertyValue("-webkit-backdrop-filter");
      const hasFilter = (cs.filter && cs.filter !== "none") || (bf && bf !== "none");
      const label = `${el.tagName.toLowerCase()}.${el.className?.toString().slice(0, 50) ?? ""}`;

      // Any element whose animation touches filter is a violation outright,
      // whether or not it currently has one.
      for (const name of cs.animationName.split(",").map((s) => s.trim())) {
        if (name && name !== "none" && filterKeyframes.has(name)) {
          bad.push(`${label} runs @keyframes ${name} which animates filter`);
        }
      }

      if (!hasFilter) continue;

      // transition-property's INITIAL value is `all`, so getComputedStyle
      // reports "all" for every element that declares no transition at all.
      // Checking the property list alone flagged the portrait glow, the contact
      // card and the dock - none of which transition anything, because their
      // transition-duration is 0s. A transition only exists if it has duration.
      const durations = cs.transitionDuration
        .split(",")
        .map((s) => parseFloat(s.trim()))
        .filter((n) => Number.isFinite(n));
      const animates = durations.some((d) => d > 0);
      if (!animates) continue;

      if (TRANSITIONS_FILTER.test(cs.transitionProperty)) {
        bad.push(
          `${label} carries filter "${cs.filter}"/"${bf}" AND transitions ` +
            `"${cs.transitionProperty}" over ${cs.transitionDuration}`,
        );
      }
    }
    return bad;
  });

  expect(offenders, "elements that would animate a filter").toEqual([]);
});

test("the scrim is bounded to the photo region and never covers a whole section", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await revealAll(page);

  const scrims = await page.locator(".scrim").count();
  expect(scrims, "each photo region carries a scrim").toBe(2);

  const bounded = await page.evaluate(() => {
    return Array.from(document.querySelectorAll<HTMLElement>(".scrim")).map((s) => {
      const region = s.closest(".photo-region");
      const section = s.closest("section");
      const sr = s.getBoundingClientRect();
      const secr = section?.getBoundingClientRect();
      return {
        insideRegion: Boolean(region),
        // A scrim that covers >85% of its section's area is a section scrim in
        // disguise, which §6 forbids.
        areaShare: secr && secr.width * secr.height > 0
          ? (sr.width * sr.height) / (secr.width * secr.height)
          : 1,
      };
    });
  });

  for (const s of bounded) {
    expect(s.insideRegion, "scrim must live inside a .photo-region").toBe(true);
    expect(s.areaShare, "scrim covers nearly its whole section").toBeLessThan(0.85);
  }
});

// ---------------------------------------------------------------------------
// Assets and performance
// ---------------------------------------------------------------------------

test("every declared variant exists on disk at its declared size, and none upscales", async () => {
  for (const photo of PHOTOS) {
    const [iw, ih] = photo.intrinsic;
    for (const v of photo.variants) {
      const path = join(process.cwd(), "public", v.src.replace(/^\//, ""));
      expect(existsSync(path), `${v.src} missing`).toBe(true);
      expect(statSync(path).size, `${v.src} byte count drifted`).toBe(v.bytes);

      // Escape closed: a manifest can claim any width. Upscaling past the
      // source is barred outright - the original plan's 1920px variants would
      // have enlarged both sources by 8% and 25%.
      expect(v.w, `${v.src} exceeds source width ${iw}`).toBeLessThanOrEqual(iw);
      expect(v.h, `${v.src} exceeds source height ${ih}`).toBeLessThanOrEqual(ih);

      // Aspect must survive resizing, or the crop maths in the manifest lies.
      expect(Math.abs(v.w / v.h - iw / ih)).toBeLessThan(0.01);
    }
  }
});

test("srcSet width descriptors match the real files, and the LCP photo is eager", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });

  for (const photo of PHOTOS) {
    for (const type of ["image/webp", "image/jpeg"] as const) {
      const set = srcSetFor(photo, type);
      expect(set.length, `${photo.id} ${type} srcSet empty`).toBeGreaterThan(0);
      for (const entry of set.split(",")) {
        const [src, w] = entry.trim().split(/\s+/);
        const declared = photo.variants.find((v) => v.src === src);
        expect(declared, `${src} not in manifest`).toBeTruthy();
        expect(w, `${src} width descriptor`).toBe(`${declared!.w}w`);
      }
    }
  }

  // The hero photo is the LCP element; the contact band must not compete.
  const hero = page.locator(`img[data-photo="${HERO_PHOTO.id}"]`);
  await expect(hero).toHaveAttribute("loading", "eager");
  await expect(hero).toHaveAttribute("fetchpriority", "high");
  const contact = page.locator(`img[data-photo="${CONTACT_PHOTO.id}"]`);
  await expect(contact).toHaveAttribute("loading", "lazy");
});

test("hero-critical image bytes stay within budget", async () => {
  // Budget covers what a 1280px-wide DPR-1 viewport actually fetches for the
  // LCP element: one WebP variant, not the whole family.
  const BUDGET = 60 * 1024;
  const candidate = HERO_PHOTO.variants
    .filter((v) => v.type === "image/webp" && v.w >= 1280)
    .sort((a, b) => a.w - b.w)[0];
  expect(candidate, "no >=1280 WebP hero variant").toBeTruthy();
  expect(candidate!.bytes, `hero WebP ${candidate!.w}px is ${candidate!.bytes}B`).toBeLessThan(
    BUDGET,
  );
});
