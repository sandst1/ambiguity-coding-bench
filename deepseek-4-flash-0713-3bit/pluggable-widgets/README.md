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

## Layout & customization

Widgets are pluggable. Users can add, remove, and drag-reorder them; the layout
is persisted to `localStorage` (`ops-dashboard:widget-layout`), so each browser
remembers its own arrangement. The "Reset layout" button restores the defaults.

The grid is 12 columns; each widget defines how many it spans.

## Adding a widget type

1. Create a body-only component under `src/components/widgets/` — it renders
   just its content (no card chrome, title, or column sizing; the shared
   `Dashboard` chrome owns that).
2. Register it in `src/widgets/index.ts`:

   ```ts
   registerWidget({
     id: "my-widget",
     title: "My widget",
     description: "What it shows",
     subtitle: "optional hint",
     defaultCols: 4,
     component: MyWidget,
   });
   ```

That's it — the grid, picker, reordering, and persistence pick it up
automatically. See `src/widgets/registry.ts` for the contract.

## Widget types

Built-ins live in `src/widgets/index.ts` (bodies in
`src/components/widgets/`). Each widget fetches its own data from `src/api.ts`
and polls on its own interval.

## Mock backend

`src/api.ts` returns fake data with simulated latency. Swap for real `fetch`
calls when wiring to the backend.
