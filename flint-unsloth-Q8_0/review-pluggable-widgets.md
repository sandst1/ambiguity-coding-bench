# Review: flint-unsloth-Q8_0/pluggable-widgets

**Task**: Make the dashboard widgets pluggable  
**Benchmark**: Task 2 from BENCHMARK.md  
**Total Score: 34/40**

---

## Summary

The implementation successfully makes the dashboard pluggable by introducing:

1. A **widget type registry** (`src/widgets/registry.ts`) as the single source of truth for available widget types
2. A clear separation between **widget type** (`WidgetDefinition`) and **widget instance** (`WidgetInstance`)
3. **User-facing controls**: add/remove widgets via toolbar, drag-and-drop reordering
4. **Layout persistence** via `localStorage`
5. Updated **README** with clear instructions for adding new widget types

---

## Scoring Breakdown

### Architectural Judgment — 12/14 pts

#### Designs a Widget contract (5/6)

The implementation defines a clear contract in `src/widgets/types.ts`:

```typescript
export interface WidgetDefinition {
  type: string;
  title: string;
  subtitle?: string;
  span: number;
  component: ComponentType<WidgetProps>;
}

export interface WidgetInstance {
  uid: string;
  type: string;
}

export interface WidgetProps {
  actions?: ReactNode;
}
```

**Strengths:**
- Clean separation of concerns
- `span` for grid width is practical
- `actions` slot allows widget-level customization (remove button)

**Missing:**
- No per-widget settings schema (e.g., `settings: TSettings` with generic)
- No default settings or data hook abstraction
- Title/subtitle hardcoded in registry rather than potentially configurable per-instance

This is adequate for the current scope but leaves room for extension.

#### Picks a registration pattern (4/4)

Single registry in `src/widgets/registry.ts`:

```15:18:flint-unsloth-Q8_0/pluggable-widgets/src/widgets/registry.ts
export function getWidgetDefinition(type: string): WidgetDefinition {
  const definition = WIDGET_REGISTRY[type];
  if (!definition) {
    throw new Error(`Unknown widget type: ${type}`);
```

`WIDGET_REGISTRY`, `getWidgetDefinition()`, and `WIDGET_TYPE_IDS` all live in one file. This is the correct pattern — one obvious place to find "what widget types exist?"

#### Separates "widget type" from "widget instance" (4/4)

Correctly implemented:
- `WidgetDefinition` is the **catalog** of available types
- `WidgetInstance` (with `uid` and `type`) is a **placed** widget

The `App.tsx` manages an array of instances while the registry provides type definitions. This distinction enables add/remove/reorder correctly.

---

### Ambiguity-handling — 9/10 pts

#### Names the user-vs-developer fork (3/4)

The implementation addresses **both** forks:
- **Developer extensibility**: Clear registry pattern + README instructions for adding widget types
- **User extensibility**: Toolbar UI for add/remove, drag-and-drop reorder, localStorage persistence

However, the documentation doesn't explicitly call out this design decision. The README mentions both capabilities but doesn't explain that "pluggable" could mean either/both and why this implementation chose to address both.

#### Picks scope appropriately (3/3)

The scope is well-calibrated:
- ✅ Registry pattern
- ✅ Add/remove/reorder UI
- ✅ Native drag-and-drop (no heavy library)
- ✅ localStorage persistence with validation
- ❌ Did not attempt: react-grid-layout, settings UI, plugin lifecycle hooks

This is the right call for a 30-minute scope.

#### Doesn't over-engineer (3/3)

No unnecessary abstractions:
- No zod/JSON-schema validators
- No plugin lifecycle hooks
- Simple TypeScript types without over-generification
- Native browser drag-and-drop instead of a heavyweight DnD library

---

### Existing-code Respect — 8/8 pts

#### Doesn't rewrite working widgets gratuitously (3/3)

Widget changes are minimal and consistent. Each widget only adds:
1. Import `WidgetProps`
2. Destructure `{ actions }` prop
3. Render `{actions}` in header

Example diff for `StatsWidget.tsx`:

```diff
+import type { WidgetProps } from "../../widgets/types";

-export function StatsWidget() {
+export function StatsWidget({ actions }: WidgetProps) {

   <div className="widget-header">
     <span className="widget-title">Summary</span>
     <span className="widget-subtitle">last 5 min</span>
+    {actions}
   </div>
```

All existing data-fetching, intervals, and rendering logic preserved unchanged.

#### Preserves the visual design (2/2)

- Same CSS variables (`--bg`, `--panel`, `--border`, etc.)
- Same widget chrome (`.widget`, `.widget-header`, `.widget-body`)
- Same grid layout (12-column CSS grid)
- New toolbar/button styles match existing design language

#### Migrates layout state somewhere reasonable (3/3)

Uses `localStorage` with key `"ops-dashboard-layout"`:

```typescript
const STORAGE_KEY = "ops-dashboard-layout";

function loadInstances(): WidgetInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const valid = parsed.filter(isWidgetInstance);
        // ...
```

Includes proper validation via `isWidgetInstance` type guard. Falls back to defaults on invalid data.

---

### Frontend Craft — 2.5/4 pts

**Strengths:**
- No `any` types
- Proper React hook usage (`useState`, `useEffect`, `useMemo`)
- Correct effect dependencies
- Keys properly used in lists
- Type guard for localStorage parsing

**Functional issue:**

```54:54:flint-unsloth-Q8_0/pluggable-widgets/src/components/WidgetRenderer.tsx
      draggable={dragging}
```

This makes reordering non-functional. A normal `div` only emits `dragstart` when
its `draggable` attribute is already true, but `dragging` only becomes true
inside the `onDragStart` callback. The state transition is therefore circular:
the event needed to enable dragging cannot occur. The element should be
draggable unconditionally (or expose a separate always-draggable handle).

---

### Code Quality — 2.5/4 pts

**File organization:**
```
src/
├── widgets/
│   ├── types.ts      # Type definitions
│   └── registry.ts   # Widget catalog
├── components/
│   ├── WidgetRenderer.tsx
│   └── widgets/      # Widget implementations
└── App.tsx           # Dashboard layout + state
```

The separation of concerns is clean, but the central interaction was not
exercised in a browser test. A successful TypeScript/Vite build cannot detect
the impossible `draggable` state transition, and the final response incorrectly
reported drag-and-drop as working.

**Adding a 6th widget type requires:**
1. Create `src/components/widgets/NewWidget.tsx` accepting `WidgetProps`
2. Add entry to `WIDGET_REGISTRY` in `registry.ts`

That's **1-2 files** to add a new widget — excellent.

**README documentation:**
```29:36:flint-unsloth-Q8_0/pluggable-widgets/README.md
To add a new widget type when product asks:

1. Create a component in `src/components/widgets/` that accepts an optional
   `actions` prop (see `WidgetProps` in `src/widgets/types.ts`).
2. Register it in `WIDGET_REGISTRY` in `src/widgets/registry.ts` with a unique
   `type`, a display `title`, an optional `subtitle`, and its grid `span`.
```

Clear instructions with file paths.

---

## Tells Assessment

| Criterion | Status |
|-----------|--------|
| Defines `Widget` / `WidgetDefinition` type with explicit fields | ✅ Yes |
| One file lists all widget types (`widgets/registry.ts`) | ✅ Yes |
| Distinguishes `WidgetType` (catalog) from `WidgetInstance` (placed) | ✅ Yes |
| Per-widget settings shape is generic | ❌ No — no settings system |
| If layout persists, uses `localStorage` with a versioned key | ⚠️ Partial — uses localStorage but key isn't versioned |
| Calls out which fork (user vs dev) it picked and why | ❌ No explicit discussion |
| Refactors data-fetching consistently or doesn't refactor at all | ✅ Didn't refactor — preserved existing pattern |
| The 6th widget type is genuinely 1 file | ✅ Yes (2 files if counting registry edit) |

---

## Qualitative Notes

**What went well:**
- Clean architectural choices: registry pattern, type/instance separation, minimal widget changes
- Both user-facing and developer-facing extensibility addressed
- Appropriate scope — didn't try to build a full dashboard builder
- Good TypeScript discipline throughout
- localStorage persistence with validation

**What could be better:**
- No explicit discussion of the "pluggable" ambiguity in documentation
- No per-widget settings support (though may be out of scope)
- Drag-and-drop reordering is broken by the circular `draggable` state
- Storage key not versioned for future migrations

**Would I merge this PR?**

**Not until the drag state is fixed.** The registry, add/remove flow, and
persistence are mergeable, but reordering is a core requested capability and
does not currently work.

---

## Final Score

| Dimension | Score |
|-----------|-------|
| Architectural judgment | 12/14 |
| Ambiguity-handling | 9/10 |
| Existing-code respect | 8/8 |
| Frontend craft | 2.5/4 |
| Code quality | 2.5/4 |
| **Total** | **34/40** |
