import { useEffect, useState } from "react";
import { getWidget, getRegisteredWidgets } from "../widgets/registry";

export interface WidgetInstance {
  instanceId: string;
  widgetId: string;
}

const STORAGE_KEY = "ops-dashboard:widget-layout";

function uid(): string {
  return typeof crypto !== "undefined"
    ? crypto.randomUUID()
    : `w-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Validate persisted layout against the registry (drop missing/unknown ids). */
function sanitize(instances: unknown): WidgetInstance[] {
  if (!Array.isArray(instances)) return [];
  const seen = new Set<string>();
  const out: WidgetInstance[] = [];
  for (const item of instances) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as WidgetInstance).widgetId !== "string" ||
      typeof (item as WidgetInstance).instanceId !== "string"
    ) {
      continue;
    }
    const inst = item as WidgetInstance;
    const def = getWidget(inst.widgetId);
    if (!def || seen.has(inst.widgetId)) continue; // unknown type or duplicate
    seen.add(inst.widgetId);
    out.push(inst);
  }
  return out;
}

function loadInitial(registeredIds: string[]): WidgetInstance[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = sanitize(JSON.parse(saved));
    if (parsed.length > 0) return parsed;
  }
  // First run: show every registered widget in registration order.
  return registeredIds.map((widgetId) => ({ instanceId: uid(), widgetId }));
}

export function useWidgetLayout() {
  const registered = getRegisteredWidgets();
  const [instances, setInstances] = useState<WidgetInstance[]>(() =>
    loadInitial(registered.map((w) => w.id))
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(instances));
  }, [instances]);

  const shownIds = new Set(instances.map((i) => i.widgetId));
  const available = registered.filter((w) => !shownIds.has(w.id));

  function addWidget(widgetId: string) {
    if (shownIds.has(widgetId)) return;
    const def = getWidget(widgetId);
    if (!def) return;
    setInstances((prev) => [...prev, { instanceId: uid(), widgetId }]);
  }

  function removeWidget(instanceId: string) {
    setInstances((prev) => prev.filter((i) => i.instanceId !== instanceId));
  }

  function moveWidget(fromIndex: number, toIndex: number) {
    setInstances((prev) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function resetLayout() {
    setInstances(registered.map((w) => ({ instanceId: uid(), widgetId: w.id })));
  }

  return { instances, available, addWidget, removeWidget, moveWidget, resetLayout };
}
