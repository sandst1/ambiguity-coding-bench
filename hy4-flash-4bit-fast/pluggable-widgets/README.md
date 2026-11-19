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

Widgets live in a 12-column CSS grid. The default layout follows the
registration order in `src/components/widgets/registry.ts`:

| Widget       | Type      | File                                        | Cols |
| ------------ | --------- | ------------------------------------------- | ---- |
| Summary      | `stats`   | `src/components/widgets/StatsWidget.tsx`    | 3    |
| Latency      | `latency` | `src/components/widgets/LatencyWidget.tsx`  | 6    |
| Errors       | `errors`  | `src/components/widgets/ErrorsWidget.tsx`   | 3    |
| Activity     | `activity`| `src/components/widgets/ActivityWidget.tsx` | 7    |
| Services     | `services`| `src/components/widgets/ServicesWidget.tsx` | 5    |

Each widget fetches its own data from `src/api.ts` and polls on its own
interval. Widgets render only their body; `WidgetFrame` supplies the title,
controls and grid placement.

## Customizing the dashboard

Users can add widgets from the **+ Add widget** menu, remove them with the ×
button, and reorder them by dragging the ⠿ handle or using the ↑ / ↓ buttons.
The layout is saved to `localStorage` under `ops-dashboard-layout`; stale
entries for unregistered widget types are ignored on load. **Reset layout**
restores the registered defaults.

## Adding a widget type

1. Create a component in `src/components/widgets/` that renders just the
   widget body (fetching/polling its own data).
2. Add one `registerWidget({ ... })` call to
   `src/components/widgets/registry.ts` with a unique `type`, `title`,
   `description`, optional `subtitle`, default `span` (1–12) and `Component`.

The new type appears in the add menu immediately and joins the default layout
for users who have not customized theirs.

## Mock backend

`src/api.ts` returns fake data with simulated latency. Swap for real `fetch`
calls when wiring to the backend.
