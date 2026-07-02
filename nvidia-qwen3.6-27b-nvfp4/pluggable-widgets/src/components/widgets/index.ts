import { registerWidget } from "../../registry";
import { StatsWidget } from "./StatsWidget";
import { LatencyWidget } from "./LatencyWidget";
import { ErrorsWidget } from "./ErrorsWidget";
import { ActivityWidget } from "./ActivityWidget";
import { ServicesWidget } from "./ServicesWidget";

registerWidget({
  type: "stats",
  title: "Summary Stats",
  description: "Requests, latency, users, error rate",
  gridSpan: 3,
  component: StatsWidget,
});

registerWidget({
  type: "latency",
  title: "Latency Chart",
  description: "Request latency over time (p95, p99)",
  gridSpan: 6,
  component: LatencyWidget,
});

registerWidget({
  type: "errors",
  title: "Error Count",
  description: "Errors in the last 5 min and 1 hour",
  gridSpan: 3,
  component: ErrorsWidget,
});

registerWidget({
  type: "activity",
  title: "Activity Feed",
  description: "Recent deploys, rollbacks, and incidents",
  gridSpan: 7,
  component: ActivityWidget,
});

registerWidget({
  type: "services",
  title: "Service Status",
  description: "Health of tracked microservices",
  gridSpan: 5,
  component: ServicesWidget,
});