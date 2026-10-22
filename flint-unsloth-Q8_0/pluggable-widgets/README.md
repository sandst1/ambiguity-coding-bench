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

## Pluggable widgets

The dashboard is pluggable via a widget registry.

- `src/widgets/types.ts` — `WidgetInstance`, `WidgetDefinition`, `WidgetProps`
- `src/widgets/registry.ts` — built-in registry, `getWidgetDefinition`, `WIDGET_TYPE_IDS`

To add a new widget type when product asks:

1. Create a component in `src/components/widgets/` that accepts an optional
   `actions` prop (see `WidgetProps` in `src/widgets/types.ts`).
2. Register it in `WIDGET_REGISTRY` in `src/widgets/registry.ts` with a unique
   `type`, a display `title`, an optional `subtitle`, and its grid `span`.

Once registered, the widget can be added, removed, and reordered from the
dashboard toolbar like any built-in widget.

## Layout

Widgets render into a 12-column CSS grid, in user-defined order (default order
shown below). Each widget declares its grid width via its registry entry.

| Widget       | File                                           | Cols |
| ------------ | ---------------------------------------------- | ---- |
| Summary      | `src/components/widgets/StatsWidget.tsx`       | 3    |
| Latency      | `src/components/widgets/LatencyWidget.tsx`     | 6    |
| Errors       | `src/components/widgets/ErrorsWidget.tsx`      | 3    |
| Activity     | `src/components/widgets/ActivityWidget.tsx`    | 7    |
| Services     | `src/components/widgets/ServicesWidget.tsx`    | 5    |

## Mock backend

`src/api.ts` returns fake data with simulated latency. Swap for real `fetch`
calls when wiring to the backend.
