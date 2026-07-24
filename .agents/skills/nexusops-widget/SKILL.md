---
name: nexusops-widget
description: Use when adding a new widget, panel, or card to the NexusOps fintech operations dashboard. Triggers on "new widget", "dashboard panel", "NexusOps component", "add widget", or "corridor panel".
---

# NexusOps Widget Author

## When to use

Adding a new widget, panel, card, or section to the NexusOps dashboard. This applies to any React component rendered inside `DashboardLayout` that displays data, status, charts, or controls.

## Design system

NexusOps is a dark industrial fintech terminal aesthetic. All widgets must follow these tokens:

- **Page background:** `bg-slate-950`
- **Card surface:** `bg-zinc-900`
- **Card header/title:** `text-zinc-100`
- **Body text/labels:** `text-zinc-400`
- **Accent:** `text-amber-400`, `bg-amber-400`, `border-amber-400/30`
- **Borders:** `border-zinc-700` or `border-zinc-700/50`
- **Data values:** `font-mono` (JetBrains Mono via the `font-mono` Tailwind class)
- **Labels:** default sans (Inter)
- **Spacing:** tight padding, typically `p-4` or `p-6`, gap `gap-4`
- **Shadows:** subtle or none; avoid large diffuse shadows
- **Grid background:** the page already has a `.grid-bg` overlay; do not add competing patterns

Do not introduce new colors, gradients, or rounded styles outside this palette unless the user explicitly asks for a different visual direction.

## Component shape

Create a new file under `src/components/<WidgetName>.tsx` and use this shell:

```tsx
import { useAuth } from "@/context/AuthContext";

export function WidgetName() {
  const { role } = useAuth();

  return (
    <section className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-100">Widget Title</h3>
        <span className="text-xs text-zinc-500">Meta</span>
      </header>
      <div className="text-zinc-400 text-sm">
        {/* content */}
      </div>
    </section>
  );
}
```

If the widget should be role-gated, wrap it in `Protected` from `@/components/Protected`:

```tsx
<Protected allowedRoles={["admin", "analyst"]}>
  <WidgetName />
</Protected>
```

Allowed roles: `admin`, `analyst`, `viewer`. Use the least privilege that matches the data sensitivity.

## Data patterns

- Use `useDashboardTransactions` from `@/hooks/useDashboardTransactions` for paginated feed and chart data.
- Use `useTransactions` from the same hook for raw real-time stream data.
- Use the `TransactionsContext` from `@/context/TransactionsContext` when a widget needs the same stream already shared by the ticker or other widgets.
- Keep widgets self-contained; accept props only when the parent needs to configure behavior.

## Animation

- Use `framer-motion` for entrance/exit animations.
- Keep motion subtle: `initial={{ opacity: 0, y: 4 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.2 }}`.
- Use `AnimatePresence mode="wait"` for role-dependent element swaps.

## Live data

- Subscribe to `useDashboardTransactions` or `TransactionsContext` for live updates.
- Show a connection indicator (green dot / amber pulse) when streaming is active.
- Format timestamps and currency via `src/lib/format.ts` helpers.

## Integration

1. Build the widget as a standalone component.
2. Import it into `src/pages/Index.tsx` (or the relevant page).
3. Place it inside the dashboard grid layout, respecting the existing column structure.
4. If it is role-gated, wrap it with `Protected`.
5. Verify the widget renders correctly in the live preview at all roles (`admin`, `analyst`, `viewer`).
6. If the widget adds new data needs, update the shared `TransactionsContext` rather than opening a second stream.

## Validation

- The widget compiles without TypeScript errors.
- Hardcoded colors are limited to the allowed token list above; lint warnings about palette are expected and ignored.
- Role-gated widgets hide for `viewer` when the role is switched.
- The preview shows the widget in the dashboard grid without layout breakage.
