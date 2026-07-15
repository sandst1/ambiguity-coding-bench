import { createContext, useContext, useState, useCallback } from "react";
import { registry, type WidgetInstance } from "./widget-types";

const STORAGE_KEY = "ops-dashboard-layout-v1";

export interface DashboardLayoutState {
  /** Ordered list of widget instances the user wants on their dashboard */
  widgets: WidgetInstance[];

  /** The full list of available widget types (from registry) */
  availableTypes: readonly { id: string; name: string }[];
}

const STORAGE_DEFAULTS = [
  { typeId: "stats", order: 0 },
  { typeId: "latency", order: 1 },
  { typeId: "errors", order: 2 },
  { typeId: "activity", order: 3 },
  { typeId: "services", order: 4 },
];

function loadLayout(): WidgetInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return STORAGE_DEFAULTS.map((d) => ({ ...d }));
    const parsed = JSON.parse(raw) as WidgetInstance[];
    // Validate against current registry — remove any widget types that no longer exist
    const availableIds = new Set(registry.getAll().map((w) => w.id));
    return parsed.filter((w) => availableIds.has(w.typeId)).sort((a, b) => a.order - b.order);
  } catch {
    return STORAGE_DEFAULTS.map((d) => ({ ...d }));
  }
}

function saveLayout(widgets: WidgetInstance[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  } catch {
    // localStorage may be unavailable (private browsing, etc.)
  }
}

export interface DashboardContextValue {
  widgets: WidgetInstance[];
  availableTypes: readonly { id: string; name: string }[];
  addWidget(typeId: string): void;
  removeWidget(typeId: string): void;
  moveUp(index: number): void;
  moveDown(index: number): void;
  resetLayout(): void;
}

export const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within a DashboardProvider");
  return ctx;
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [widgets, setWidgets] = useState<WidgetInstance[]>(loadLayout);

  const availableTypes = registry.getAll().map((w) => ({ id: w.id, name: w.name }));

  const addWidget = useCallback(
    (typeId: string) => {
      setWidgets((prev) => {
        // If this widget type already exists in the layout, move it to the end
        const existing = prev.find((w) => w.typeId === typeId);
        if (existing) {
          return [...prev.filter((w) => w.typeId !== typeId), existing];
        }
        return [...prev, { typeId, order: prev.length }];
      });
    },
    []
  );

  const removeWidget = useCallback(
    (typeId: string) => {
      setWidgets((prev) => prev.filter((w) => w.typeId !== typeId));
    },
    []
  );

  const moveUp = useCallback(
    (index: number) => {
      setWidgets((prev) => {
        if (index <= 0) return prev;
        const next = [...prev];
        [next[index], next[index - 1]] = [next[index - 1], next[index]];
        return next.map((w, i) => ({ ...w, order: i }));
      });
    },
    []
  );

  const moveDown = useCallback(
    (index: number) => {
      setWidgets((prev) => {
        if (index >= prev.length - 1) return prev;
        const next = [...prev];
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
        return next.map((w, i) => ({ ...w, order: i }));
      });
    },
    []
  );

  const resetLayout = useCallback(() => {
    setWidgets(STORAGE_DEFAULTS.map((d) => ({ ...d })));
  }, []);

  return (
    <DashboardContext.Provider value={{ widgets, availableTypes, addWidget, removeWidget, moveUp, moveDown, resetLayout }}>
      {children}
    </DashboardContext.Provider>
  );
}
