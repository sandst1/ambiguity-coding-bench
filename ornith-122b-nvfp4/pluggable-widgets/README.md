# ops-dashboard

Internal ops dashboard. Shows production health metrics, recent activity, and
service status at a glance.

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

## Layout

Widgets render into a 12-column CSS grid. The default layout is six widget
types, rendered in this order:

| Widget          | Type             | File                                                 | Cols |
| --------------- | ---------------- | ---------------------------------------------------- | ---- |
| Summary         | `stats`          | `src/components/widgets/StatsWidget.tsx`             | 3    |
| Latency         | `latency`        | `src/components/widgets/LatencyWidget.tsx`           | 6    |
| Errors          | `errors`         | `src/components/widgets/ErrorsWidget.tsx`            | 3    |
| Activity        | `activity`       | `src/components/widgets/ActivityWidget.tsx`          | 7    |
| Services        | `services`       | `src/components/widgets/ServicesWidget.tsx`          | 5    |
| Service health  | `service-tally`  | `src/components/widgets/ServiceTallyWidget.tsx`      | 3    |

Each widget fetches its own data from `src/api.ts` and polls on its own
interval.

## Customization

Users can **Customize** the dashboard: add widgets from a palette, remove
them, and reorder with the ↑/↓ controls in each widget header. The layout is
persisted to `localStorage` (`ops-dashboard.layout.v1`), so it survives
reloads. Removing a widget type from the registry only affects newly-added
dashboards — existing saved layouts that reference it are skipped on load.

## Adding a widget type (pluggable)

Widgets are self-registering plugins. To add one:

1. Create a body component under `src/components/widgets/` that exports e.g.
   `function MyWidgetBody() { ... }`. It renders its own content (and a
   `<span className="loading">Loading…</span>` while data is absent). The
   shell (`src/widgets/WidgetShell.tsx`) provides the title, grid span, and
   chrome — the widget only renders its body.
2. Register it in `src/widgets/registry.ts`:

   ```ts
   registerWidget({
     type: "my-widget",       // stable id used in saved layouts
     label: "My Widget",      // shown in the header + add palette
     cols: 4,                 // default 12-col grid span
     subtitle: "optional",    // optional
     component: MyWidgetBody,
   });
   ```

That's it — the new type appears in the add palette and can be added, removed,
and reordered like any other.

## Framework layout

- `src/widgets/registry.ts` — the plugin registry (`registerWidget`, `getWidget`, `listWidgets`).
- `src/widgets/types.ts` — `WidgetDescriptor` / `WidgetInstance` types.
- `src/widgets/WidgetShell.tsx` — widget chrome + grid span + edit controls.
- `src/widgets/useDashboard.ts` — owns the ordered instance list + persistence.
- `src/widgets/AddPalette.tsx` — the add-widget picker.

## Mock backend

`src/api.ts` returns fake data with simulated latency. Swap for real `fetch`
calls when wiring to the backend.
