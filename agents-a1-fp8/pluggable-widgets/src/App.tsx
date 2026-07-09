import { DashboardProvider, useDashboard } from "./components/dashboard/DashboardProvider";
import { Dashboard } from "./components/dashboard/Dashboard";
import { EditPanel } from "./components/dashboard/EditPanel";
import "./styles.css";

function DashboardApp() {
  const { state, toggleEditMode } = useDashboard();

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ops Dashboard</h1>
        <button className="btn btn-secondary" onClick={toggleEditMode}>
          {state.isEditMode ? "Exit Edit Mode" : "Edit Dashboard"}
        </button>
      </header>

      {state.isEditMode && <EditPanel />}

      <Dashboard />
    </div>
  );
}

export function App() {
  return (
    <DashboardProvider>
      <DashboardApp />
    </DashboardProvider>
  );
}
