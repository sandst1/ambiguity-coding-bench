/**
 * Built-in widget types.
 *
 * To add a NEW widget type:
 *  1. Add a body component (see the existing ones in src/components/widgets).
 *  2. Register it here: `import` the component and add a `registerWidget({...})`
 *     call with a unique id, title, description, default column span, and the
 *     component.
 * That's it — the dashboard, picker, layout, and persistence pick it up
 * automatically.
 */
import { registerWidget } from "./registry";
import { StatsWidget } from "../components/widgets/StatsWidget";
import { LatencyWidget } from "../components/widgets/LatencyWidget";
import { ErrorsWidget } from "../components/widgets/ErrorsWidget";
import { ActivityWidget } from "../components/widgets/ActivityWidget";
import { ServicesWidget } from "../components/widgets/ServicesWidget";

registerWidget({
  id: "stats",
  title: "Summary",
  description: "Key request, latency, user and error metrics",
  subtitle: "last 5 min",
  defaultCols: 3,
  component: StatsWidget,
});

registerWidget({
  id: "latency",
  title: "Request latency",
  description: "p95 / p99 latency trend for the last 2 hours",
  subtitle: "last 2h, ms",
  defaultCols: 6,
  component: LatencyWidget,
});

registerWidget({
  id: "errors",
  title: "Errors",
  description: "Error count in the last 5 minutes and hour",
  subtitle: "last 5 min",
  defaultCols: 3,
  component: ErrorsWidget,
});

registerWidget({
  id: "activity",
  title: "Recent activity",
  description: "Recent deploys, rollbacks and incidents",
  subtitle: "all environments",
  defaultCols: 7,
  component: ActivityWidget,
});

registerWidget({
  id: "services",
  title: "Services",
  description: "Status and uptime of tracked services",
  defaultCols: 5,
  component: ServicesWidget,
});
