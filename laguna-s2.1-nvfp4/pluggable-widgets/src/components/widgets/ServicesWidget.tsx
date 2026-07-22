import { registerWidget } from "../../widgets/registry";
import { fetchServiceStatuses, type ServiceStatus } from "../../api";

registerWidget({
  id: "services",
  name: "Services",
  description: "",
  defaultWidth: 5,
  render: ({ data }) => {
    const services = data as ServiceStatus[];
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
  },
  fetch: fetchServiceStatuses,
  intervalMs: 30_000,
});
