import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DATA } from "../../data/resume";

/**
 * Metadata contract for Phase 6.
 *
 * Asserted against RENDERED HTML and REAL HTTP RESPONSES, because the point is
 * what a crawler or social scraper actually receives.
 *
 * Four traps this file deliberately avoids, each of which would let an assertion
 * pass while the thing it checks is broken:
 *
 * - `page.goto()` RESOLVES on a 404, so artefact tests assert response.status().
 * - Reading public/og.png from disk passes even when the tag points elsewhere, so
 *   the image is fetched from the URL in the rendered tag.
 * - A name-and-count match on JSON-LD says nothing about @type or topology.
 * - The live site normalises og:url with a trailing slash the source omits, so
 *   URL comparisons normalise first.
 */

const SITE = "https://jerilkuriakose.github.io";
const norm = (u: string) => u.replace(/\/+$/, "");

const meta = (html: string, attr: "name" | "property", key: string) => {
  const re = new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`, "g");
  return [...html.matchAll(re)].map((m) => m[1]);
};

async function html(page: import("@playwright/test").Page): Promise<string> {
  const res = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(res?.status(), "the page itself must be 200").toBe(200);
  return page.content();
}

test("title, description and the card titles agree exactly", async ({ page }) => {
  const h = await html(page);
  const title = (h.match(/<title>([^<]*)<\/title>/) ?? [])[1];
  const desc = meta(h, "name", "description")[0];

  expect(title, "page must have a title").toBeTruthy();
  expect(desc, "page must have a description").toBeTruthy();

  // Exact equality, not vague "consistency". A canonical cannot equal a title,
  // so the relationships are stated per-pair.
  expect(meta(h, "property", "og:title")[0]).toBe(title);
  expect(meta(h, "name", "twitter:title")[0]).toBe(title);
  expect(meta(h, "property", "og:description")[0]).toBe(desc);
  expect(meta(h, "name", "twitter:description")[0]).toBe(desc);
});

test("canonical and og:url are the same URL", async ({ page }) => {
  const h = await html(page);
  const canonical = (h.match(/<link rel="canonical" href="([^"]*)"/) ?? [])[1];
  const ogUrl = meta(h, "property", "og:url")[0];

  expect(canonical, "a canonical must be emitted").toBeTruthy();
  // Normalise: Next serves og:url with a trailing slash the source omits.
  expect(norm(canonical)).toBe(norm(SITE));
  expect(norm(ogUrl)).toBe(norm(canonical));
});

test("exactly one title, description, canonical and robots tag", async ({ page }) => {
  const h = await html(page);
  expect((h.match(/<title>/g) ?? []).length, "duplicate <title>").toBe(1);
  expect(meta(h, "name", "description").length, "duplicate description").toBe(1);
  expect((h.match(/<link rel="canonical"/g) ?? []).length, "duplicate canonical").toBe(1);
  expect(meta(h, "name", "robots").length, "duplicate robots").toBe(1);
});

test("the og:image is absolute, and its DECLARED size matches the real file", async ({
  page,
  request,
}) => {
  const h = await html(page);
  const url = meta(h, "property", "og:image")[0];
  const w = meta(h, "property", "og:image:width")[0];
  const ht = meta(h, "property", "og:image:height")[0];

  expect(url, "og:image must be an absolute URL").toMatch(/^https?:\/\//);
  expect(w).toBe("1200");
  expect(ht).toBe("630");
  expect(meta(h, "name", "twitter:card")[0]).toBe("summary_large_image");

  // Fetch the image the TAG points at - not public/og.png from disk. A disk check
  // passes while the tag references a different asset, which is exactly the bug
  // this replaces: the old tag declared 800x800 for a 996x1325 portrait.
  const res = await request.get(url.replace(SITE, ""));
  expect(res.status(), "og:image must actually exist").toBe(200);
  const buf = await res.body();
  expect(buf.subarray(1, 4).toString(), "must be a PNG").toBe("PNG");
  expect(buf.readUInt32BE(16), "real image width").toBe(1200);
  expect(buf.readUInt32BE(20), "real image height").toBe(630);
});

const ARTEFACTS: Array<[string, RegExp, string]> = [
  ["/sitemap.xml", /xml/, SITE],
  ["/robots.txt", /text\/plain/, `Sitemap: ${SITE}/sitemap.xml`],
  ["/llms.txt", /text\/plain/, DATA.name],
];

for (const [path, contentType, sentinel] of ARTEFACTS) {
  test(`${path} is served with real content`, async ({ request }) => {
    const res = await request.get(path);
    // A status assertion is essential: page.goto() resolves on a 404, so a
    // navigation-based check would pass with the file absent.
    expect(res.status(), `${path} must be 200`).toBe(200);
    expect(res.headers()["content-type"] ?? "").toMatch(contentType);
    expect(await res.text(), `${path} must contain ${sentinel}`).toContain(sentinel);
  });
}

test("JSON-LD is one valid graph whose types and topology are correct", async ({ page }) => {
  const h = await html(page);
  const blocks = [
    ...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
  ].map((m) => m[1]);

  expect(blocks.length, "exactly one JSON-LD block").toBe(1);

  const parsed = JSON.parse(blocks[0]);
  expect(parsed["@context"]).toBe("https://schema.org");

  const graph = parsed["@graph"];
  expect(Array.isArray(graph), "must use @graph").toBe(true);

  const people = graph.filter((n: { "@type": string }) => n["@type"] === "Person");
  const articles = graph.filter(
    (n: { "@type": string }) => n["@type"] === "ScholarlyArticle",
  );

  expect(people.length, "exactly one Person").toBe(1);
  expect(people[0].name).toBe(DATA.name);
  expect(people[0].jobTitle).toBe(DATA.title);
  expect(articles.length, "one article per publication").toBe(DATA.publications.length);

  // every article must reference the Person by @id, not duplicate it
  for (const a of articles) {
    expect(a.author?.["@id"], "article must reference the Person @id").toBe(
      `${SITE}/#person`,
    );
  }

  // and no article may claim a generic profile URL as its own identifier
  for (const a of articles) {
    if (a.url) expect(a.url, "article url must identify the article").not.toContain("scholar.google");
  }
  expect(
    articles.filter((a: { url?: string }) => a.url).length,
    "only publications with a real identifier carry a url",
  ).toBe(DATA.publications.filter((p) => p.url.includes("doi.org")).length);
});

test("llms.txt agrees with DATA", async () => {
  // A committed file cannot import DATA, so this assertion is what actually
  // prevents drift - not the intention to keep them in sync.
  const txt = readFileSync(join(process.cwd(), "public/llms.txt"), "utf8");
  expect(txt).toContain(DATA.name);
  expect(txt).toContain(DATA.title);
  expect(txt).toContain(DATA.contact.email);
  // both approved G3 claims
  expect(txt).toContain("~100,000");
  expect(txt).toContain("~35%");
  for (const pub of DATA.publications) {
    expect(txt, `llms.txt must list "${pub.title.slice(0, 30)}"`).toContain(
      pub.title.slice(0, 30),
    );
  }
});

test("the accessibility landmarks and names §9 requires are present", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  // skip link: first focusable, and it must actually target something
  const skip = page.locator("a[href='#main-content']");
  await expect(skip).toHaveCount(1);
  await page.keyboard.press("Tab");
  await expect(skip, "the skip link must be the FIRST focusable element").toBeFocused();
  await expect(page.locator("#main-content")).toHaveCount(1);

  // landmarks
  await expect(page.locator("header")).toHaveCount(1);
  await expect(page.locator("main")).toHaveCount(1);
  // real <nav> elements, each distinctly named
  const navs = page.locator("nav[aria-label]");
  expect(await navs.count(), "social rail + mobile dock must be <nav>").toBeGreaterThanOrEqual(2);
  const labels = await navs.evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
  expect(new Set(labels).size, "nav labels must be distinct").toBe(labels.length);

  // every section names itself
  const unnamed = await page.evaluate(() =>
    Array.from(document.querySelectorAll("section[id]"))
      .filter((s) => !s.getAttribute("aria-labelledby"))
      .map((s) => s.id),
  );
  expect(unnamed, `sections without an accessible name: ${unnamed.join(", ")}`).toEqual([]);

  // and each aria-labelledby must resolve to a real element
  const dangling = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[aria-labelledby]"))
      .map((el) => el.getAttribute("aria-labelledby")!)
      .filter((id) => !document.getElementById(id)),
  );
  expect(dangling, `aria-labelledby pointing at nothing: ${dangling.join(", ")}`).toEqual([]);

  // icon-only links have a discernible name
  const nameless = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a"))
      .filter((a) => {
        const hasText = (a.textContent ?? "").trim().length > 0;
        const hasLabel = a.getAttribute("aria-label") || a.getAttribute("title");
        return !hasText && !hasLabel;
      })
      .map((a) => a.getAttribute("href") ?? "?"),
  );
  expect(nameless, `links with no accessible name: ${nameless.join(", ")}`).toEqual([]);
});

test("the dead classes §9 flagged are gone", () => {
  const tooltip = readFileSync(join(process.cwd(), "components/ui/tooltip.tsx"), "utf8");
  // tailwindcss-animate was never a dependency, so these emitted no CSS at all
  expect(tooltip).not.toMatch(/animate-in|fade-in-0|zoom-in-95/);
  const fp = readFileSync(
    join(process.cwd(), "components/sections/featured-project.tsx"),
    "utf8",
  );
  // bg-grid-pattern is defined 0 times in globals.css
  expect(fp).not.toContain("bg-grid-pattern");
});
