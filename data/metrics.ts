/** A single quantified claim, attached to the record it came from. */
export type Metric = {
  /** Stable, unique across the whole dataset. Referenced by featuredMetricIds. */
  id: string;
  /** The number as it should render, e.g. "50 TB", "~35%". */
  value: string;
  /** Short caption, e.g. "corpus processed". */
  label: string;
  /** Optional qualifier shown only where space allows. */
  note?: string;
};

type WithMetrics = { readonly metrics?: readonly Metric[] };

/**
 * Resolve DATA.featuredMetricIds to Metric objects, preserving declared order.
 *
 * Returns [] when nothing is featured - the hero proof row is then omitted
 * entirely, per the spec's container contract. Unresolvable ids are dropped
 * here and caught loudly by tests/visual/evidence-schema.spec.ts rather than
 * rendering a hole.
 */
export function resolveFeaturedMetrics(data: {
  readonly featuredMetricIds: readonly string[];
  readonly work: readonly WithMetrics[];
  readonly projects: readonly WithMetrics[];
}): Metric[] {
  const all = [...data.work, ...data.projects].flatMap((e) => e.metrics ?? []);
  const byId = new Map(all.map((m) => [m.id, m]));
  return data.featuredMetricIds
    .map((id) => byId.get(id))
    .filter((m): m is Metric => m !== undefined);
}
