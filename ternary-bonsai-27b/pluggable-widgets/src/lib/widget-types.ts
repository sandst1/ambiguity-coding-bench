/**
 * Pluggable widget system for the Ops Dashboard.
 *
 * Every widget is a { id, name, component, gridSpan } tuple.
 * Register a new widget with `registry.registerWidget()` — that's all.
 */

export interface WidgetDefinition {
  /** Unique identifier for this widget type */
  id: string;

  /** Display title shown in the header */
  name: string;

  /** The React component to render */
  component: React.FC<WidgetProps>;

  /** Number of grid columns this widget occupies (default 3) */
  gridSpan?: number;

  /** Optional schema describing user-configurable options */
  configSchema?: WidgetConfigSchema;
}

export interface WidgetConfigSchema {
  /** Human label for the config option */
  label: string;

  /** Type of value */
  type: "number" | "string" | "boolean" | "select";

  /** Default value */
  default: unknown;

  /** For select, list of available options */
  options?: { label: string; value: unknown }[];

  /** Validation function (returns true if valid) */
  validate?: (value: unknown) => boolean;
}

export interface WidgetInstance {
  /** Which widget type this instance belongs to */
  typeId: string;

  /** Where this widget sits in the user's layout (0-based index) */
  order: number;

  /** User-configurable settings for this instance */
  config?: unknown;
}

/**
 * Props passed to a widget component.
 * Existing widgets may not accept these — see WidgetCard for the wrapper pattern.
 */
/**
 * Props passed to a widget component.
 * Existing widgets may not accept these — see WidgetCard for the wrapper pattern.
 */
export interface WidgetProps {
  /** The widget definition that created this instance */
  type?: WidgetDefinition;
  /** Instance-specific config (may be undefined) */
  config?: unknown;
}

export interface WidgetInstance {
  /** Which widget type this instance belongs to */
  typeId: string;

  /** Where this widget sits in the user's layout (0-based index) */
  order: number;

  /** User-configurable settings for this instance */
  config?: unknown;
}

/**
 * Central registry — add new widgets here.
 * Designed to be importable from other packages so product teams can
 * ship additional widget types without touching the core dashboard.
 */
const _registry = new Map<string, WidgetDefinition>();

export const registry = {
  /** Add a widget type. Idempotent — later calls override earlier ones. */
  registerWidget(def: WidgetDefinition): void {
    _registry.set(def.id, def);
  },

  /** Get all registered widget types */
  getAll(): readonly WidgetDefinition[] {
    return Array.from(_registry.values());
  },

  /** Get a single widget type by id */
  get(id: string): WidgetDefinition | undefined {
    return _registry.get(id);
  },

  /** Check if a widget type exists */
  has(id: string): boolean {
    return _registry.has(id);
  },

  /** Clear all widgets (useful for tests) */
  clear(): void {
    _registry.clear();
  },
};

export const widgetTypes = registry;
