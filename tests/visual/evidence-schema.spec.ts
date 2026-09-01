import { test, expect } from "@playwright/test";
import { DATA } from "../../data/resume";
import { resolveFeaturedMetrics } from "../../data/metrics";
import { HeroProofRow } from "../../components/sections/hero-proof-row";
import { RoleMetrics } from "../../components/sections/role-metrics";

test("every work and project entry has a unique id", () => {
  const ids = [
    ...DATA.work.map((w) => w.id),
    ...DATA.projects.map((p) => p.id),
  ];
  expect(ids.every((i) => typeof i === "string" && i.length > 0)).toBe(true);
  expect(new Set(ids).size).toBe(ids.length);
});

test("every metric id is unique across the whole dataset", () => {
  const all = [...DATA.work, ...DATA.projects].flatMap((e) => e.metrics ?? []);
  const ids = all.map((m) => m.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("every featured metric id resolves to a real metric", () => {
  const all = [...DATA.work, ...DATA.projects].flatMap((e) => e.metrics ?? []);
  for (const id of DATA.featuredMetricIds) {
    expect(
      all.some((m) => m.id === id),
      `featuredMetricIds contains "${id}" which resolves to nothing`,
    ).toBe(true);
  }
});

test("resolveFeaturedMetrics returns them in declared order", () => {
  const got = resolveFeaturedMetrics(DATA).map((m) => m.id);
  expect(got).toEqual([...DATA.featuredMetricIds]);
});

test("at most two metrics are featured in the hero", () => {
  // The §5 container contract specifies the proof row carries two claims.
  // Without this, three or more ids would resolve, pass every other test, and
  // silently render an overflowing row.
  expect(DATA.featuredMetricIds.length).toBeLessThanOrEqual(2);
});

test("no placeholder or lorem values ship", () => {
  const all = [...DATA.work, ...DATA.projects].flatMap((e) => e.metrics ?? []);
  for (const m of all) {
    expect(m.value, `metric ${m.id}`).not.toMatch(/tbd|todo|lorem|xxx|\?\?\?/i);
    expect(m.label, `metric ${m.id}`).not.toMatch(/tbd|todo|lorem|xxx|\?\?\?/i);
  }
});

// --- container contract -------------------------------------------------
// Both containers are Server Components with no hooks, so calling them as
// plain functions is legitimate and needs no renderer. This proves the
// null-return contract at 0..N without waiting for Phase 1b content.

const M = (id: string) => ({ id, value: "1", label: "x" });

test("evidence containers render nothing when empty, something when not", () => {
  expect(HeroProofRow({ metrics: [] })).toBeNull();
  expect(HeroProofRow({ metrics: [M("a")] })).not.toBeNull();
  expect(HeroProofRow({ metrics: [M("a"), M("b")] })).not.toBeNull();

  expect(RoleMetrics({}), "absent metrics").toBeNull();
  expect(RoleMetrics({ metrics: [] }), "empty metrics").toBeNull();
  // per-role evidence is uncapped, unlike the hero row
  expect(RoleMetrics({ metrics: [M("a"), M("b"), M("c")] })).not.toBeNull();
});
