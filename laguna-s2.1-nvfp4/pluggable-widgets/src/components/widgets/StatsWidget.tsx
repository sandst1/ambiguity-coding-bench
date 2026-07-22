import { registerWidget } from "../../widgets/registry";
import { fetchSummaryStats, type SummaryStats } from "../../api";

registerWidget({
  id: "stats",
  name: "Summary",
  description: "last 5 min",
  defaultWidth: 3,
  render: ({ data }) => {
    const stats = data as SummaryStats;
    return (
      <div className="stat-grid">
        <Stat label="req/min" value={stats.requestsPerMin.toLocaleString()} delta={stats.requestsDelta} />
        <Stat label="p99 ms" value={String(stats.p99LatencyMs)} delta={stats.latencyDelta} invertColor />
        <Stat label="users" value={stats.activeUsers.toLocaleString()} delta={stats.usersDelta} />
        <Stat label="err %" value={stats.errorRate.toFixed(2)} delta={stats.errorRateDelta} invertColor />
      </div>
    );
  },
  fetch: fetchSummaryStats,
  intervalMs: 30_000,
});

function Stat({
  label,
  value,
  delta,
  invertColor = false,
}: {
  label: string;
  value: string;
  delta: number;
  invertColor?: boolean;
}) {
  const positive = delta > 0;
  const isGood = invertColor ? !positive : positive;
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className={`stat-delta ${isGood ? "up" : "down"}`}>
        {positive ? "+" : ""}
        {delta}%
      </span>
    </div>
  );
}
