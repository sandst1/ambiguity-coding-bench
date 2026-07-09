import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface WidgetInstance {
  id: string;
  width?: "normal" | "wide" | "tall";
}

interface DashboardState {
  widgets: WidgetInstance[];
  isEditMode: boolean;
}

interface DashboardContextType {
  state: DashboardState;
  setWidgets: (widgets: WidgetInstance[]) => void;
  toggleEditMode: () => void;
  setEditMode: (editMode: boolean) => void;
  addWidget: (id: string, width?: "normal" | "wide" | "tall") => void;
  removeWidget: (id: string) => void;
  moveWidget: (fromIndex: number, toIndex: number) => void;
  setWidgetWidth: (id: string, width: "normal" | "wide" | "tall") => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);
const STORAGE_KEY = "dashboard_widget_config";

function loadFromStorage(): DashboardState["widgets"] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load dashboard config from localStorage:", e);
  }
  return [];
}

function saveToStorage(widgets: DashboardState["widgets"]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  } catch (e) {
    console.error("Failed to save dashboard config to localStorage:", e);
  }
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [widgets, setWidgetsState] = useState<WidgetInstance[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const loaded = loadFromStorage();
    setWidgetsState(loaded);
  }, []);

  useEffect(() => {
    saveToStorage(widgets);
  }, [widgets]);

  const setWidgets = useCallback((newWidgets: WidgetInstance[]) => {
    setWidgetsState(newWidgets);
  }, []);

  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev);
  }, []);

  const setEditMode = useCallback((editMode: boolean) => {
    setIsEditMode(editMode);
  }, []);

  const addWidget = useCallback((id: string, width: "normal" | "wide" | "tall" = "normal") => {
    setWidgetsState(prev => [...prev, { id, width }]);
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgetsState(prev => prev.filter(w => w.id !== id));
  }, []);

  const moveWidget = useCallback((fromIndex: number, toIndex: number) => {
    setWidgetsState(prev => {
      const newWidgets = [...prev];
      const [moved] = newWidgets.splice(fromIndex, 1);
      newWidgets.splice(toIndex, 0, moved);
      return newWidgets;
    });
  }, []);

  const setWidgetWidth = useCallback((id: string, width: "normal" | "wide" | "tall") => {
    setWidgetsState(prev => prev.map(w => w.id === id ? { ...w, width } : w));
  }, []);

  const value: DashboardContextType = {
    state: { widgets, isEditMode },
    setWidgets,
    toggleEditMode,
    setEditMode,
    addWidget,
    removeWidget,
    moveWidget,
    setWidgetWidth,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}