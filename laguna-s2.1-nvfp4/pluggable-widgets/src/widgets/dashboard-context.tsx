import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getAllWidgets, getWidget } from "./registry";

export interface LayoutItem {
  widgetId: string;
  w: number;
}

export interface DashboardLayoutState {
  items: LayoutItem[];
  isEditing: boolean;
}

export interface DashboardContextValue extends DashboardLayoutState {
  addItem: (widgetId: string) => void;
  removeItem: (widgetId: string) => void;
  reorderItems: (items: LayoutItem[]) => void;
  toggleEditing: () => void;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

const STORAGE_KEY = "dashboard:layout";

function loadLayout(): LayoutItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LayoutItem[];
      const registeredIds = new Set(getAllWidgets().map((w) => w.id));
      const valid = parsed.filter((item) => registeredIds.has(item.widgetId));
      if (valid.length > 0) return valid;
    }
  } catch {
    // fall through to defaults
  }

  return getAllWidgets().map((w) => ({ widgetId: w.id, w: w.defaultWidth }));
}

function saveLayout(items: LayoutItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore write errors
  }
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<LayoutItem[]>(loadLayout);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    saveLayout(items);
  }, [items]);

  const addItem = (widgetId: string) => {
    const widget = getWidget(widgetId);
    if (!widget || items.some((item) => item.widgetId === widgetId)) return;
    setItems((prev) => [...prev, { widgetId, w: widget.defaultWidth }]);
  };

  const removeItem = (widgetId: string) => {
    setItems((prev) => prev.filter((item) => item.widgetId !== widgetId));
  };

  const reorderItems = (newItems: LayoutItem[]) => {
    setItems(newItems);
  };

  const toggleEditing = () => setIsEditing((v) => !v);

  return (
    <DashboardContext.Provider
      value={{ items, isEditing, addItem, removeItem, reorderItems, toggleEditing }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return ctx;
}
