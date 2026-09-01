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

test("both evidence containers are absent while no metrics exist", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // Container contract: omitted entirely, not an empty box.
  expect(await page.locator("section#hero dl").count()).toBe(0);
  expect(await page.locator("section#experience dl").count()).toBe(0);
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
 * Horizontal overflow is a PRE-EXISTING defect, not a regression from the
 * decomposition. Measured identical at HEAD before this phase (via a clean
 * `git worktree` build): 38 / 77 / 128px at 375 / 768 / 1280.
 *
 * Cause: the hero's two decorative blur blobs sit at `left-[-10%]` and
 * `right-[-10%]` inside an `absolute inset-0` container with no
 * `overflow-hidden`, so the bleed scales with the viewport - which is why the
 * spec's "39px mobile overflow" note understates it.
 *
 * Spec §9 sets the acceptance target at *none* for all three widths. Until the
 * phase that owns that fix, this locks the defect at its known size so it
 * cannot silently grow. Tighten to 0 when it is fixed.
 */
const KNOWN_OVERFLOW: Record<number, number> = { 375: 38, 768: 77, 1280: 128 };

for (const width of [375, 768, 1280]) {
  test(`horizontal overflow at ${width}px does not exceed the known defect`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(
      overflow,
      `${width}px overflows by ${overflow}px; known pre-existing is ${KNOWN_OVERFLOW[width]}px`,
    ).toBeLessThanOrEqual(KNOWN_OVERFLOW[width]);
  });
}
