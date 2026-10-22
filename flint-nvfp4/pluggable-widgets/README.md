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

Widgets render in a 12-column CSS grid. Each widget declares how many columns
it spans via its `defaultCols` in the widget registry.

## Customization

Users can customize the dashboard:

- **Add** widgets via the “Add widget” menu in the header.
- **Remove** a widget via the × button on the card (visible on hover).
- **Reorder** widgets by dragging a card’s header onto another card.

The chosen layout is persisted to `localStorage` (key: `ops-dashboard:layout`).

## Adding a new widget type

Widget types are registered in `src/widgets/registry.ts`:

1. Create `src/components/widgets/<Name>Widget.tsx` exporting `<Name>Widget`,
   which renders only the widget body (the card chrome is added automatically).
2. Add an entry to `WIDGET_REGISTRY` with an `id`, `title`, optional `subtitle`,
   `defaultCols`, and the component.

The new widget then appears in the “Add widget” menu automatically.

## Mock backend

`src/api.ts` returns fake data with simulated latency. Swap for real `fetch`
calls when wiring to the backend.
