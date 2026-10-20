import { useEffect, useState } from "react";
import { fetchServiceStatuses, type ServiceStatus } from "../../api";

export function ServiceTallyWidgetBody() {
  const [services, setServices] = useState<ServiceStatus[] | null>(null);

  useEffect(() => {
    fetchServiceStatuses().then(setServices);
    const id = setInterval(() => fetchServiceStatuses().then(setServices), 30_000);
    return () => clearInterval(id);
  }, []);

  if (services == null) return <span className="loading">Loading…</span>;

  const counts = { ok: 0, warn: 0, down: 0 };
  for (const s of services) counts[s.status]++;

  return (
    <div className="tally-grid">
      <Tally status="ok" label="ok" count={counts.ok} total={services.length} />
      <Tally status="warn" label="warn" count={counts.warn} total={services.length} />
      <Tally status="down" label="down" count={counts.down} total={services.length} />
    </div>
  );
}

function Tally({
  status,
  label,
  count,
  total,
}: {
  status: ServiceStatus["status"];
  label: string;
  count: number;
  total: number;
}) {
  return (
    <div className="tally-cell">
      <span className={`service-status ${status}`}>{label}</span>
      <span className="tally-value">{count}</span>
      <span className="tally-of">of {total}</span>
    </div>
  );
}
