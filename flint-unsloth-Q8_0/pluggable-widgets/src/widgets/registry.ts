import { StatsWidget } from "../components/widgets/StatsWidget";
import { LatencyWidget } from "../components/widgets/LatencyWidget";
import { ErrorsWidget } from "../components/widgets/ErrorsWidget";
import { ActivityWidget } from "../components/widgets/ActivityWidget";
import { ServicesWidget } from "../components/widgets/ServicesWidget";
import type { WidgetDefinition } from "./types";

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  stats: {
    type: "stats",
    title: "Summary",
    subtitle: "last 5 min",
    span: 3,
    component: StatsWidget,
  },
  latency: {
    type: "latency",
    title: "Request latency",
    subtitle: "last 2h, ms",
    span: 6,
    component: LatencyWidget,
  },
  errors: {
    type: "errors",
    title: "Errors",
    subtitle: "last 5 min",
    span: 3,
    component: ErrorsWidget,
  },
  activity: {
    type: "activity",
    title: "Recent activity",
    subtitle: "all environments",
    span: 7,
    component: ActivityWidget,
  },
  services: {
    type: "services",
    title: "Services",
    subtitle: "uptime",
    span: 5,
    component: ServicesWidget,
  },
};

export function getWidgetDefinition(type: string): WidgetDefinition {
  const definition = WIDGET_REGISTRY[type];
  if (!definition) {
    throw new Error(`Unknown widget type: ${type}`);
  }
  return definition;
}

export const WIDGET_TYPE_IDS: string[] = Object.keys(WIDGET_REGISTRY);
