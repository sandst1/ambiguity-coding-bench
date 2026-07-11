import type React from "react";

export interface WidgetMetadata {
  id: string;
  name: string;
  description: string;
  defaultSpan: number;
  component: React.FC;
}

const registry = new Map<string, WidgetMetadata>();

export function registerWidget(meta: WidgetMetadata) {
  if (registry.has(meta.id)) {
    console.warn(`Widget "${meta.id}" already registered, overwriting.`);
  }
  registry.set(meta.id, meta);
  return meta;
}

export function getWidget(id: string): WidgetMetadata | undefined {
  return registry.get(id);
}

export function getAllWidgets(): ReadonlyArray<WidgetMetadata> {
  return Array.from(registry.values());
}

export function isRegistered(id: string): boolean {
  return registry.has(id);
}