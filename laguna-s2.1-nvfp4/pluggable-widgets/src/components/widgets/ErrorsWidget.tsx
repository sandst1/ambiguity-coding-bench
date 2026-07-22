import { registerWidget } from "../../widgets/registry";
import { fetchErrorCount, type ErrorCount } from "../../api";

const ALERT_THRESHOLD = 10;

registerWidget({
  id: "errors",
  name: "Errors",
  description: "last 5 min",
  defaultWidth: 3,
  render: ({ data }) => {
    const errors = data as ErrorCount;
    return (
      <>
        <div
          className="error-big"
          style={{ color: errors.last5min >= ALERT_THRESHOLD ? "var(--bad)" : "var(--text)" }}
        >
          {errors.last5min}
        </div>
        <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 6 }}>
          {errors.last1hr} in last hour
        </div>
      </>
    );
  },
  fetch: fetchErrorCount,
  intervalMs: 15_000,
});
