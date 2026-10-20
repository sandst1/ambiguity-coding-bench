# Review: ornith-122b-nvfp4 — Pluggable Widgets

**Task**: Make the dashboard widgets pluggable  
**Model**: ornith-122b-nvfp4  
**Rubric**: BENCHMARK.md Task 2 (40 pts)

---

## Summary

This is a **strong implementation** that delivers both end-user customization (add/remove/reorder widgets) and developer extensibility (clean widget contract and registry). The architecture is well-structured with proper separation of concerns. A new 6th widget (`ServiceTallyWidget`) was added to demonstrate the pattern works.

**Total Score: 37/40**

---

## Scoring Breakdown

### Architectural Judgment — 13/14

| Criterion | Score | Max | Notes |
|-----------|-------|-----|-------|
| Designs a Widget contract | 5 | 6 | `WidgetDescriptor` has proper fields: `type`, `label`, `cols`, `subtitle?`, `component`. Missing only a generic settings type (`settings: TSettings`), but that's optional for scope. |
| Picks a registration pattern | 4 | 4 | Single `registry.ts` file with Map-based registry. Clear API: `registerWidget`, `getWidget`, `listWidgets`. All widget types in one place. |
| Separates type from instance | 4 | 4 | Clear distinction: `WidgetDescriptor` (catalog/type) vs `WidgetInstance` (placed instance with own id). Dashboard state is list of instances. |

**Strong signals**:
- ✅ Defines `WidgetDescriptor` type with explicit fields
- ✅ One file lists all widget types (`widgets/registry.ts`)
- ✅ Distinguishes type from instance cleanly
- ✅ Instance can override descriptor defaults (e.g., `cols`)

The Widget contract from `types.ts`:

```typescript
export interface WidgetDescriptor {
  type: string;        // stable id for persisted layout
  label: string;       // shown in header and palette
  cols: number;        // default 12-column grid span
  subtitle?: string;   // optional subtitle
  component: ComponentType;  // the widget's body component
}

export interface WidgetInstance {
  id: string;      // unique per placed widget
  type: string;    // references WidgetDescriptor.type
  cols?: number;   // optional per-instance override
}
```

---

### Ambiguity-handling — 8/10

| Criterion | Score | Max | Notes |
|-----------|-------|-----|-------|
| Names the user-vs-developer fork | 2 | 4 | Implements *both* user and developer extensibility, but doesn't explicitly discuss the fork or reasoning. Silent pick — just did both. |
| Picks scope appropriately | 3 | 3 | No drag-and-drop library, no complex settings UI. Simple reorder buttons. Appropriate for task scope. |
| Doesn't over-engineer | 3 | 3 | No JSON-schema validators, no zod, no lifecycle hooks. Simple localStorage persistence. |

**Weak signal**: The model did both user-facing and developer-facing extensibility without calling out that these are distinct readings of "pluggable." A stronger response would have explicitly stated: "I'm doing both because X" or asked "Which do you mean?"

---

### Existing-code Respect — 8/8

| Criterion | Score | Max | Notes |
|-----------|-------|-----|-------|
| Doesn't rewrite widgets gratuitously | 3 | 3 | All widgets refactored consistently (`XWidget` → `XWidgetBody`). Data-fetching pattern preserved (same useEffect + setInterval). Logic unchanged. |
| Preserves visual design | 2 | 2 | Same CSS variables, same widget chrome (now in `WidgetShell`), same grid feel. Added customization UI styles cleanly. |
| Migrates layout state reasonably | 3 | 3 | Uses `localStorage` with versioned key `ops-dashboard.layout.v1`. Includes validation on load, filters unknown types, falls back to defaults. |

**Example of consistent refactoring** — the original `StatsWidget`:

```tsx
// BEFORE: Full widget with wrapper and header
export function StatsWidget() {
  return (
    <div className="widget widget--stats">
      <div className="widget-header">...</div>
      <div className="widget-body">...</div>
    </div>
  );
}
```

```tsx
// AFTER: Just the body — shell provides chrome
export function StatsWidgetBody() {
  // Same data-fetching logic preserved
  if (data == null) return <span className="loading">Loading…</span>;
  return <div className="stat-grid">...</div>;
}
```

All five original widgets received the same treatment.

---

### Frontend Craft — 4/4

- **TypeScript discipline**: No `any` visible. Proper type annotations throughout.
- **Hook usage**: Appropriate use of `useState`, `useEffect`, `useCallback`.
- **No React footguns**: 
  - Keys present on all mapped elements
  - Effect dependencies correct
  - No infinite re-render risks
- **Clean component composition**: Shell wraps body, palette lists types, dashboard hook owns state

---

### Code Quality — 4/4

- **Clear file organization**:
  - `src/widgets/` — framework (registry, types, shell, hook, palette)
  - `src/components/widgets/` — widget implementations
- **Good naming**: `WidgetDescriptor`, `WidgetInstance`, `useDashboard`, `WidgetShell`
- **Comprehensive README**: Explains layout, customization, and how to add new widget types
- **The "6th widget" test passes**: Adding a new widget requires:
  1. Create component file
  2. Add `registerWidget()` call
  
  They demonstrated this by adding `ServiceTallyWidget` as a 6th widget type.

---

## Tells Assessment

| Strong Signal | Present? |
|---------------|----------|
| Defines `Widget`/`WidgetDefinition` type with explicit fields | ✅ Yes |
| One file lists all widget types (`widgets/registry.ts`) | ✅ Yes |
| Distinguishes `WidgetType` (catalog) from `WidgetInstance` (placed) | ✅ Yes |
| Per-widget settings shape is generic (`settings: TSettings`) | ❌ No — fixed fields |
| Layout persists with `localStorage` and versioned key | ✅ Yes |
| Calls out which fork (user vs dev) it picked and why | ❌ No — silent pick |
| Refactors data-fetching consistently or doesn't refactor at all | ✅ Yes — all consistent |
| The 6th widget type is genuinely 1 file | ✅ Yes |

| Weak Signal | Present? |
|-------------|----------|
| Just adds props to existing components | ❌ No |
| List of types appears in 2+ files | ❌ No |
| Single `Widget` shape muddles both type and instance | ❌ No |
| Settings hardcoded per widget | ⚠️ Partially — no generic settings |
| Persists but never reads back / no migration story | ❌ No — proper load/validation |
| Silent pick, often just one feature implemented | ⚠️ Silent pick, but did both |
| Refactors one widget, leaves three alone | ❌ No |
| The 6th widget requires edits in 3+ files | ❌ No |

---

## Qualitative Notes

**What surprised me**: The model added a 6th widget type (`ServiceTallyWidget` — a service health summary with ok/warn/down counts) to demonstrate the pattern works. This shows good architectural thinking — proving the abstraction by using it.

**Where the model shined**:
- Clean separation of concerns with the registry pattern
- Consistent refactoring of all widgets (no haphazard partial changes)
- Proper localStorage persistence with validation and fallback
- Adding customization UI without breaking the existing visual design

**Where the model stumbled**:
- Didn't explicitly recognize or discuss the user-vs-developer fork in "pluggable" — just silently did both
- No generic settings type (minor — appropriate for scope, but a stronger answer would note this as future work)

---

## Would Merge?

**Yes, without hesitation.**

This is a well-architected solution that solves both the end-user customization problem and the developer extensibility problem with minimal complexity. The code is clean, the patterns are correct, and the implementation is complete. A new developer adding the 7th widget type can do so by reading the README and creating one file.

The only significant gap is the lack of explicit reasoning about the user/developer fork, but the implementation quality more than compensates.

---

## Final Score

| Section | Score | Max |
|---------|-------|-----|
| Architectural judgment | 13 | 14 |
| Ambiguity-handling | 8 | 10 |
| Existing-code respect | 8 | 8 |
| Frontend craft | 4 | 4 |
| Code quality | 4 | 4 |
| **Total** | **37** | **40** |
