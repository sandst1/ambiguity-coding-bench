import React from "react";
import { getAvailableWidgets, getWidgetType } from "./registry";

export interface PlacedWidget {
  id: string;
  type: string;
}

const LAYOUT_KEY = "dashboard-layout";

function loadLayout(): PlacedWidget[] {
  const all = getAvailableWidgets();
  const defaults: PlacedWidget[] = all.map((w) => ({
    id: `default-${w.type}`,
    type: w.type,
  }));

  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PlacedWidget[];
      return parsed.filter((p) => getWidgetType(p.type) !== undefined);
    }
  } catch {
    // ignore corrupt data
  }
  return defaults;
}

function saveLayout(layout: PlacedWidget[]) {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  } catch {
    // ignore quota errors
  }
}

interface DashboardState {
  layout: PlacedWidget[];
  addWidget: (type: string) => void;
  removeWidget: (id: string) => void;
  reorderWidget: (dragIndex: number, hoverIndex: number) => void;
  resetLayout: () => void;
}

const DashboardCtx = React.createContext<DashboardState | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [layout, setLayout] = React.useState<PlacedWidget[]>(loadLayout);

  React.useEffect(() => {
    saveLayout(layout);
  }, [layout]);

  const addWidget = (type: string) => {
    setLayout((prev) => [
      ...prev,
      { id: `w${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type },
    ]);
  };

  const removeWidget = (id: string) => {
    setLayout((prev) => prev.filter((w) => w.id !== id));
  };

  const reorderWidget = (dragIndex: number, hoverIndex: number) => {
    if (dragIndex === hoverIndex) return;
    setLayout((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(dragIndex, 1);
      copy.splice(hoverIndex, 0, removed);
      return copy;
    });
  };

const resetLayout = () => {
    const defaults: PlacedWidget[] = getAvailableWidgets().map((w) => ({
      id: `default-${w.type}`,
      type: w.type,
    }));
    setLayout(defaults);
  };

  return (
    <DashboardCtx.Provider
      value={{ layout, addWidget, removeWidget, reorderWidget, resetLayout }}
    >
      {children}
    </DashboardCtx.Provider>
  );
}

export function useDashboard(): DashboardState {
  const ctx = React.useContext(DashboardCtx);
  if (!ctx) throw new Error("useDashboard must be inside DashboardProvider");
  return ctx;
}