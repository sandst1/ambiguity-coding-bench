import { useEffect, useState } from "react";
import { fetchErrorCount, type ErrorCount } from "../../api";
import { registerWidget } from "../../registry";

const ALERT_THRESHOLD = 10;

export function ErrorsWidget() {
  const [data, setData] = useState<ErrorCount | null>(null);

  useEffect(() => {
    fetchErrorCount().then(setData);
    const id = setInterval(() => fetchErrorCount().then(setData), 15_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="widget-body" style={{ alignItems: "center", justifyContent: "center" }}>
      {data == null ? (
        <span className="loading">Loading…</span>
      ) : (
        <>
          <div
            className="error-big"
            style={{ color: data.last5min >= ALERT_THRESHOLD ? "var(--bad)" : "var(--text)" }}
          >
            {data.last5min}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 6 }}>
            {data.last1hr} in last hour
          </div>
        </>
      )}
    </div>
  );
}

registerWidget({
  id: "errors",
  label: "Errors",
  defaultSpan: 3,
  component: ErrorsWidget,
});
