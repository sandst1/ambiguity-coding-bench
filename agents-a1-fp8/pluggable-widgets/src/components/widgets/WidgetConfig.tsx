import { WidgetDefinition } from "./types";
import { StatsWidget } from "./StatsWidget";
import { LatencyWidget } from "./LatencyWidget";
import { ErrorsWidget } from "./ErrorsWidget";
import { ActivityWidget } from "./ActivityWidget";
import { ServicesWidget } from "./ServicesWidget";
import { CustomWidget } from "./CustomWidget";

const registry = new Map<string, Omit<WidgetDefinition, "id">>();

export const WidgetConfig = {
  /** Register a widget definition */
  register: function(id: string, definition: Omit<WidgetDefinition, "id">) {
    const full: WidgetDefinition = { ...definition, id };
    registry.set(id, full);
  },

  /** Get all registered widgets */
  getAll: function(): WidgetDefinition[] {
    return Array.from(registry.entries()).map(([id, def]) => ({ ...def, id }));
  },

  /** Get a widget by ID */
  get: function(id: string): WidgetDefinition | undefined {
    const def = registry.get(id);
    if (!def) return undefined;
   return { ...def, id };
  },

  /** Check if a widget is registered */
  has: function(id: string): boolean {
    return registry.has(id);
  },

  /** Built-in widgets */
  initBuiltIn: function() {
    this.register("stats", {
      name: "Summary Stats",
      description: "Displays key metrics: requests per minute, latency, active users, error rate",
      render: StatsWidget,
      width: "normal",
      cssClass: "widget--stats",
    });

    this.register("latency", {
      name: "Request Latency",
      description: "Charts p95 and p99 latency over time",
      render: LatencyWidget,
      width: "wide",
      cssClass: "widget--latency",
    });

    this.register("errors", {
      name: "Error Count",
      description: "Shows error counts for the last 5 minutes and last hour",
      render: ErrorsWidget,
      width: "normal",
      cssClass: "widget--errors",
    });

    this.register("activity", {
      name: "Recent Activity",
      description: "List of recent deployment and infrastructure changes",
      render: ActivityWidget,
      width: "normal",
      cssClass: "widget--activity",
    });

    this.register("services", {
      name: "Services",
      description: "Status and uptime for each tracked service",
      render: ServicesWidget,
      width: "wide",
      cssClass: "widget--services",
    });

    this.register("custom", {
      name: "Custom Widget",
      description: "A customizable widget that can display any data",
      render: CustomWidget,
      width: "normal",
      cssClass: "widget--custom",
    });
  },
};

// Initialize built-in widgets
WidgetConfig.initBuiltIn();