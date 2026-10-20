import type { WidgetDescriptor } from "./types";
import { StatsWidgetBody } from "../components/widgets/StatsWidget";
import { LatencyWidgetBody } from "../components/widgets/LatencyWidget";
import { ErrorsWidgetBody } from "../components/widgets/ErrorsWidget";
import { ActivityWidgetBody } from "../components/widgets/ActivityWidget";
import { ServicesWidgetBody } from "../components/widgets/ServicesWidget";
import { ServiceTallyWidgetBody } from "../components/widgets/ServiceTallyWidget";

const registry = new Map<string, WidgetDescriptor>();

export function registerWidget(descriptor: WidgetDescriptor): void {
  registry.set(descriptor.type, descriptor);
}

export function getWidget(type: string): WidgetDescriptor | undefined {
  return registry.get(type);
}

export function listWidgets(): WidgetDescriptor[] {
  return [...registry.values()];
}

registerWidget({
  type: "stats",
  label: "Summary",
  cols: 3,
  subtitle: "last 5 min",
  component: StatsWidgetBody,
});
registerWidget({
  type: "latency",
  label: "Request latency",
  cols: 6,
  subtitle: "last 2h, ms",
  component: LatencyWidgetBody,
});
registerWidget({
  type: "errors",
  label: "Errors",
  cols: 3,
  subtitle: "last 5 min",
  component: ErrorsWidgetBody,
});
registerWidget({
  type: "activity",
  label: "Recent activity",
  cols: 7,
  subtitle: "all environments",
  component: ActivityWidgetBody,
});
registerWidget({
  type: "services",
  label: "Services",
  cols: 5,
  component: ServicesWidgetBody,
});
registerWidget({
  type: "service-tally",
  label: "Service health",
  cols: 3,
  subtitle: "ok / warn / down",
  component: ServiceTallyWidgetBody,
});
