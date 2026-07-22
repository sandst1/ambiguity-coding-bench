import { registerWidget } from "../../widgets/registry";
import { fetchActivity, type ActivityEvent } from "../../api";

registerWidget({
  id: "activity",
  name: "Recent activity",
  description: "all environments",
  defaultWidth: 7,
  render: ({ data }) => {
    const events = data as ActivityEvent[];
    return (
      <ul className="activity-list">
        {events.map((e) => (
          <li key={e.id} className="activity-item">
            <span>
              <strong>{e.actor}</strong> {e.action}
            </span>
            <span className="activity-when">{e.when}</span>
          </li>
        ))}
      </ul>
    );
  },
  fetch: fetchActivity,
  intervalMs: 45_000,
});
