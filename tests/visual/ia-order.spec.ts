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
  expect(await page.getByRole("heading", { name: /^about me$/i }).count()).toBe(0);
});

test("the positioning summary moved INTO Experience", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // A distinctive clause from the real summary, with markdown emphasis stripped.
  const probe = DATA.summary.split(/[.\n]/)[0].replace(/\*\*/g, "").trim().slice(0, 40);
  expect(probe.length, "summary probe must be substantial").toBeGreaterThan(15);
  await expect(page.locator("section#experience")).toContainText(probe);
});

test("the duplicated skill teaser and decorative photo are gone", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });

  // The teaser's signature is a LITERAL <span>▹</span>. The highlight bullets
  // use before:content-['▹'], which is CSS generated content and invisible to
  // text matching - so this counts the teaser only.
  expect(await page.getByText("▹", { exact: true }).count()).toBe(0);

  // Skills is the single source of the skill list.
  await expect(page.locator("section#skills")).toContainText(DATA.skills[0]);

  // Two <Image>s existed: the hero portrait and the About decorative photo.
  // Only the portrait survives.
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

  // Exactly one numbered heading for the merged section. Section numbering is
  // positional (counter-increment), so a second numbered heading inside one
  // section would double-count every later heading.
  expect(await s.locator("h2.numbered-heading").count()).toBe(1);
  expect(await s.locator("h3.numbered-heading").count()).toBe(0);

  // Both group labels survive as plain h3. Note the education and award ITEMS
  // are also h3, so a bare h3 count would be wrong - match by name.
  await expect(s.getByRole("heading", { level: 3, name: /^Education$/ })).toHaveCount(1);
  await expect(
    s.getByRole("heading", { level: 3, name: /^Awards & Recognition$/ }),
  ).toHaveCount(1);
});

test("the hardcoded section number is gone from Contact", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator("section#contact")).not.toContainText("05.");
});

test("both evidence containers render the approved claims", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });

  // Phase 1a shipped these empty and this test asserted their ABSENCE. G3 was
  // resolved and Phase 1b populated two approved claims, so the assertion
  // inverts: the containers must now be present and correct. The null-return
  // behaviour at zero is still covered, by the container-contract test in
  // evidence-schema.spec.ts which calls both components with an empty array.
  const heroRow = page.locator("section#hero dl");
  await expect(heroRow).toHaveCount(1);
  expect(
    await heroRow.locator("dt").count(),
    "the §5 contract caps the hero proof row at two claims",
  ).toBe(2);

  // display order: business outcome first, technical capability second
  await expect(heroRow.locator("dt").nth(0)).toHaveText("~100,000");
  await expect(heroRow.locator("dd").nth(0)).toHaveText("man-hours saved / year");
  await expect(heroRow.locator("dt").nth(1)).toHaveText("~35%");
  await expect(heroRow.locator("dd").nth(1)).toHaveText("faster model convergence");

  // per-role evidence appears only on the two roles that carry a metric
  const roleRows = page.locator("section#experience dl");
  await expect(roleRows).toHaveCount(2);

  // and it sits OUTSIDE the collapsed disclosure, per §5 - readable without
  // expanding anything
  for (const row of await roleRows.all()) {
    await expect(row).toBeVisible();
    expect(
      await row.evaluate((el) => !!el.closest("[inert]")),
      "role metrics must not be inside the collapsed panel",
    ).toBe(false);
  }
});

test("the experience disclosure is keyboard operable and reports state", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const button = page.locator("section#experience button[aria-controls]").first();

  await expect(button).toHaveAttribute("aria-expanded", "false");
  const panelId = await button.getAttribute("aria-controls");
  const panel = page.locator(`[id="${panelId}"]`);
  await expect(panel).toHaveAttribute("aria-hidden", "true");

  // keyboard, not mouse - this is the assertion that matters for spec §9
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toHaveAttribute("aria-hidden", "false");
  await expect(panel).toContainText(/\S/);

  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "false");
});

/**
 * Horizontal overflow must be ZERO at every width.
 *
 * This was a pre-existing defect, measured identically at commit 4a6994f before
 * any of this work: 38 / 77 / 128px at 375 / 768 / 1280. Cause: the hero's two
 * decorative blur blobs sit at left-[-10%] and right-[-10%], so the bleed scaled
 * with the viewport. Phase 6 clips their container - and only their container,
 * since clipping the <section> would cut the portrait rings, the "Open to work"
 * badge, the scroll indicator and the fixed rails.
 *
 * The assertion was previously a ceiling holding the known values. It is now 0,
 * and the KNOWN_OVERFLOW map is deleted: keeping a lock after fixing the defect
 * would let it silently return.
 */
for (const width of [375, 768, 1280]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow, `${width}px overflows by ${overflow}px`).toBe(0);
  });
}
