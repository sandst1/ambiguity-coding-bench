import { useEffect, useState } from "react";
import { fetchServiceStatuses, type ServiceStatus } from "../../api";

export function ServicesWidget() {
  const [services, setServices] = useState<ServiceStatus[] | null>(null);

  useEffect(() => {
    fetchServiceStatuses().then(setServices);
    const id = setInterval(() => fetchServiceStatuses().then(setServices), 30_000);
    return () => clearInterval(id);
  }, []);

  if (services == null) {
    return <span className="loading">Loading…</span>;
  }

  return (
    <div className="services-grid">
      {services.map((s) => (
        <div key={s.name} className="service-cell">
          <span className="service-name">{s.name}</span>
          <span className={`service-status ${s.status}`}>
            {s.status} · {s.uptime}
          </span>
        </div>
      ))}
    </div>
  );
}
