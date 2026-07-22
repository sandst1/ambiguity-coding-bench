import { DashboardProvider } from "./widgets/dashboard-context";
import { DashboardLayout } from "./widgets/DashboardLayout";
import { AppHeader } from "./widgets/AppHeader";
import { useDashboard } from "./widgets/dashboard-context";
import "./widgets";

export function App() {
  return (
    <DashboardProvider>
      <AppContent />
    </DashboardProvider>
  );
}

function AppContent() {
  const { isEditing } = useDashboard();
  return (
    <div className={`app${isEditing ? " app-editing" : ""}`}>
      <AppHeader />
      <DashboardLayout />
    </div>
  );
}
