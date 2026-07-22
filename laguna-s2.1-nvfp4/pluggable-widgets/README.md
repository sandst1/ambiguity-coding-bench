# ops-dashboard

Internal ops dashboard. Shows production health metrics, recent activity, and
service status at a glance. Widgets are pluggable — add, remove, and reorder
them. The layout persists to `localStorage`.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Stack

- Vite + React 18 + TypeScript
- Recharts for the latency chart
- Plain CSS (no Tailwind / no styled-components)

## Architecture

### Widget plugin system

Each widget is a self-contained module that **registers itself** at import time
via `registerWidget()`. The dashboard discovers widgets from the registry, so
adding a new widget type is a two-step process:

1. Create the widget module in `src/components/widgets/`
2. Add an `import` line in `src/widgets/index.ts`

No other file needs to change.

### Core pieces

| File | Responsibility |
| --- | --- |
| `src/widgets/registry.ts` | `registerWidget()`, `getAllWidgets()`, `getWidget()` — the plugin registry |
| `src/widgets/dashboard-context.tsx` | React context for layout state: add, remove, reorder, persist to `localStorage` |
| `src/widgets/DashboardLayout.tsx` | The sortable grid. Each widget fetches its own data on its own interval |
| `src/widgets/WidgetWrapper.tsx` | Shared widget chrome: title, subtitle, remove button, loading/error states |
| `src/widgets/WidgetPalette.tsx` | The "Add widget" panel shown in edit mode |
| `src/widgets/AppHeader.tsx` | Header with the Edit/Done toggle |
| `src/widgets/index.ts` | Barrel file — importing it registers all widgets |

### `WidgetDefinition` interface

```ts
interface WidgetDefinition<TData = unknown> {
  id: string;            // unique key, used for CSS class and localStorage
  name: string;          // display title
  description?: string;  // subtitle shown in the header
  defaultWidth: number;  // grid-column span (1–12)
  icon?: ReactNode;      // optional icon for the palette
  render: (props: { data: TData | null; error: Error | null }) => ReactNode;
  fetch: () => Promise<TData>;
  intervalMs?: number;   // polling interval; omit for static widgets
}
```

### Adding a new widget

```ts
// src/components/widgets/MyWidget.tsx
import { registerWidget } from "../registry";
import { fetchMyData, type MyData } from "../../api";

registerWidget({
  id: "my-widget",
  name: "My Widget",
  description: "optional subtitle",
  defaultWidth: 4,
  render: ({ data }) => {
    const d = data as MyData;
    return <div>{/* your JSX */}</div>;
  },
  fetch: fetchMyData,
  intervalMs: 30_000,
});
```

Then add one line to `src/widgets/index.ts`:

```ts
import "./widgets/MyWidget";
```

That's it. The widget appears in the palette, can be added to the dashboard,
and persists across page reloads.

## Mock backend

`src/api.ts` returns fake data with simulated latency. Swap for real `fetch`
calls when wiring to the backend.

## Widget list

| Widget | File | Cols |
| --- | --- | --- |
| Summary | `src/components/widgets/StatsWidget.tsx` | 3 |
| Latency | `src/components/widgets/LatencyWidget.tsx` | 6 |
| Errors | `src/components/widgets/ErrorsWidget.tsx` | 3 |
| Activity | `src/components/widgets/ActivityWidget.tsx` | 7 |
| Services | `src/components/widgets/ServicesWidget.tsx` | 5 |
