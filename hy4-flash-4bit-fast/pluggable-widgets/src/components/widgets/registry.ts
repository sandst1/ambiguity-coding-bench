import type { ComponentType } from "react";
import { ActivityWidget } from "./ActivityWidget";
import { ErrorsWidget } from "./ErrorsWidget";
import { LatencyWidget } from "./LatencyWidget";
import { ServicesWidget } from "./ServicesWidget";
import { StatsWidget } from "./StatsWidget";

/**
 * A widget type. The host renders the frame (title, controls, grid span);
 * the component only renders the body.
 */
export interface WidgetDefinition {
  type: string;
  title: string;
  description: string;
  subtitle?: string;
  span: number;
  Component: ComponentType;
}

const registry = new Map<string, WidgetDefinition>();

/** Register a widget type. Call this once at startup, before the app renders. */
export function registerWidget(definition: WidgetDefinition): void {
  registry.set(definition.type, definition);
}

export function getWidget(type: string): WidgetDefinition | undefined {
  return registry.get(type);
}

/** Registration order doubles as the default dashboard layout. */
export function listWidgets(): WidgetDefinition[] {
  return [...registry.values()];
}

registerWidget({
  type: "stats",
  title: "Summary",
  description: "Requests, latency, users and error rate at a glance.",
  subtitle: "last 5 min",
  span: 3,
  Component: StatsWidget,
});

registerWidget({
  type: "latency",
  title: "Request latency",
  description: "p95 / p99 latency over the last 2 hours.",
  subtitle: "last 2h, ms",
  span: 6,
  Component: LatencyWidget,
});

registerWidget({
  type: "errors",
  title: "Errors",
  description: "Error count for the last 5 minutes and last hour.",
  subtitle: "last 5 min",
  span: 3,
  Component: ErrorsWidget,
});

registerWidget({
  type: "activity",
  title: "Recent activity",
  description: "Latest deploys, rollbacks and other events.",
  subtitle: "all environments",
  span: 7,
  Component: ActivityWidget,
});

registerWidget({
  type: "services",
  title: "Services",
  description: "Status and uptime for tracked services.",
  span: 5,
  Component: ServicesWidget,
});
