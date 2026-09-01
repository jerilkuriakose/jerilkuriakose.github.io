import type { Metric } from "@/data/metrics";

/**
 * A role's own quantified claims, rendered inside its experience entry and
 * OUTSIDE the collapsed highlights, so the evidence is visible without
 * expanding anything (spec §5).
 *
 * Renders nothing at zero. Unlike the hero proof row there is no cap - a role
 * may carry any number of claims.
 *
 * `metrics` is optional rather than merely possibly-empty because
 * WorkEntry.metrics is optional and every entry omits it until Phase 1b.
 */
export function RoleMetrics({ metrics }: { metrics?: readonly Metric[] }) {
  if (!metrics || metrics.length === 0) return null;

  return (
    <dl className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
      {metrics.map((m) => (
        <div key={m.id} className="flex items-baseline gap-1.5">
          <dt className="font-mono text-sm font-semibold text-primary">
            {m.value}
          </dt>
          <dd className="text-xs text-muted-foreground">{m.label}</dd>
        </div>
      ))}
    </dl>
  );
}
