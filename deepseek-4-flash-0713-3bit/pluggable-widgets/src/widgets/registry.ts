import type { ComponentType } from "react";

/**
 * A pluggable widget type.
 *
 * Adding a new widget to the dashboard is just:
 *   1. Create a component that renders ONLY the widget body
 *      (no card chrome, no title, no column sizing — the Dashboard owns that).
 *   2. Register a `WidgetDefinition` for it (see `registerWidget`).
 *
 * No other part of the app needs to change.
 */
export interface WidgetDefinition {
  /** Unique id, e.g. "stats" or "latency". */
  id: string;
  /** Human readable title shown in the card header and the picker. */
  title: string;
  /** Short description shown in the add-widget picker. */
  description: string;
  /** Grid columns this widget occupies by default (1–12). */
  defaultCols: number;
  /** Small hint shown next to the title in the card header. */
  subtitle?: string;
  /** Renders the widget body. */
  component: ComponentType;
}

const registry = new Map<string, WidgetDefinition>();

/** Register a widget type. Throws on duplicate ids to catch mistakes early. */
export function registerWidget(def: WidgetDefinition): void {
  if (registry.has(def.id)) {
    throw new Error(`A widget with id "${def.id}" is already registered.`);
  }
  registry.set(def.id, def);
}

/** Look up a single widget type by id. */
export function getWidget(id: string): WidgetDefinition | undefined {
  return registry.get(id);
}

/** All registered widget types, in registration order. */
export function getRegisteredWidgets(): WidgetDefinition[] {
  return Array.from(registry.values());
}
