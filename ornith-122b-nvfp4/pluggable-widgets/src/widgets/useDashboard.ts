import { useCallback, useState } from "react";
import type { WidgetInstance } from "./types";
import { getWidget, listWidgets } from "./registry";

const STORAGE_KEY = "ops-dashboard.layout.v1";

const DEFAULT_TYPES = ["stats", "latency", "errors", "activity", "services"];

function defaultLayout(): WidgetInstance[] {
  return DEFAULT_TYPES.map((type) => ({ id: uid(), type }));
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `w-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isWidgetInstance(x: unknown): x is WidgetInstance {
  return (
    !!x &&
    typeof x === "object" &&
    "type" in x &&
    typeof (x as { type: unknown }).type === "string"
  );
}

function load(): WidgetInstance[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  if (!raw) return defaultLayout();

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaultLayout();

    const known = new Set(listWidgets().map((w) => w.type));
    const cleaned: WidgetInstance[] = parsed
      .filter(isWidgetInstance)
      .filter((x) => known.has(x.type))
      .map((x) => {
        const cols = typeof (x as { cols?: unknown }).cols === "number" ? x.cols : undefined;
        return cols != null ? { id: uid(), type: x.type, cols } : { id: uid(), type: x.type };
      });

    return cleaned.length > 0 ? cleaned : defaultLayout();
  } catch {
    return defaultLayout();
  }
}

export function useDashboard() {
  const [instances, setInstances] = useState<WidgetInstance[]>(load);

  const update = useCallback((next: WidgetInstance[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota / disabled storage */
    }
    setInstances(next);
  }, []);

  const add = useCallback(
    (type: string) => {
      if (!getWidget(type)) return;
      update([...instances, { id: uid(), type }]);
    },
    [instances, update],
  );

  const remove = useCallback(
    (id: string) => {
      update(instances.filter((i) => i.id !== id));
    },
    [instances, update],
  );

  const move = useCallback(
    (id: string, dir: -1 | 1) => {
      const idx = instances.findIndex((i) => i.id === id);
      if (idx === -1) return;
      const j = idx + dir;
      if (j < 0 || j >= instances.length) return;
      const next = [...instances];
      [next[idx], next[j]] = [next[j], next[idx]];
      update(next);
    },
    [instances, update],
  );

  return { instances, add, remove, move };
}
