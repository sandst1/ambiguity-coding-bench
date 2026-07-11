import type { WidgetDefinition } from "./types";

const registry = new Map<string, WidgetDefinition>();

export function registerWidget(def: WidgetDefinition): void {
  if (registry.has(def.id)) {
    console.warn(`Widget "${def.id}" is already registered, overwriting.`);
  }
  registry.set(def.id, def);
}

export function getWidgetDef(typeId: string): WidgetDefinition | undefined {
  return registry.get(typeId);
}

export function getAllWidgets(): WidgetDefinition[] {
  return Array.from(registry.values());
}

export function hasWidget(typeId: string): boolean {
  return registry.has(typeId);
}
