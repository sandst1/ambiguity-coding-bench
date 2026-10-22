import type { WidgetDefinition } from "./types";
import { StatsWidget } from "../components/widgets/StatsWidget";
import { LatencyWidget } from "../components/widgets/LatencyWidget";
import { ErrorsWidget } from "../components/widgets/ErrorsWidget";
import { ActivityWidget } from "../components/widgets/ActivityWidget";
import { ServicesWidget } from "../components/widgets/ServicesWidget";

/**
 * Registry of all available widget types. To add a new widget type:
 * create the component, export it here with an id/title/defaultCols, and it
 * shows up in the dashboard automatically.
 */
export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  stats: {
    id: "stats",
    title: "Summary",
    subtitle: "last 5 min",
    defaultCols: 3,
    component: StatsWidget,
  },
  latency: {
    id: "latency",
    title: "Request latency",
    subtitle: "last 2h, ms",
    defaultCols: 6,
    component: LatencyWidget,
  },
  errors: {
    id: "errors",
    title: "Errors",
    subtitle: "last 5 min",
    defaultCols: 3,
    component: ErrorsWidget,
  },
  activity: {
    id: "activity",
    title: "Recent activity",
    subtitle: "all environments",
    defaultCols: 5,
    component: ActivityWidget,
  },
  services: {
    id: "services",
    title: "Services",
    subtitle: "status",
    defaultCols: 5,
    component: ServicesWidget,
  },
};

export function getWidgetDefinition(id: string): WidgetDefinition | undefined {
  return WIDGET_REGISTRY[id];
}

export function listWidgetIds(): string[] {
  return Object.keys(WIDGET_REGISTRY);
}
