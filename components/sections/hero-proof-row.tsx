import type { Metric } from "@/data/metrics";

/**
 * The hero's quantified-impact row. Renders NOTHING when no metrics are
 * featured - the spec's container contract requires omission rather than an
 * empty box, and forbids placeholder numbers.
 *
 * Must lay out correctly at 1 and at 2 metrics; the schema test caps
 * featuredMetricIds at 2.
 */
export function HeroProofRow({ metrics }: { metrics: readonly Metric[] }) {
  if (metrics.length === 0) return null;

  return (
    <dl className="flex flex-wrap gap-x-10 gap-y-4 py-2">
      {metrics.map((m) => (
        <div key={m.id} className="flex flex-col">
          <dt className="font-mono text-2xl font-bold text-display-accent">
            {m.value}
          </dt>
          <dd className="text-sm text-muted-foreground">{m.label}</dd>
        </div>
      ))}
    </dl>
  );
}
