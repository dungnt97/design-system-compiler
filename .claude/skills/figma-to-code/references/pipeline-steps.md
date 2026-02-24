# Pipeline Steps Reference

## Execution Flow

```
┌─────────────────┐
│  /design-tokens  │  Step 1: Extract variables → @theme CSS + TS exports
│  (figma-url)     │
└────────┬────────┘
         │ verify: src/index.css has @theme values
         ▼
┌─────────────────┐
│  /component-map  │  Step 2: Analyze components → dependency graph
│  (figma-url)     │
└────────┬────────┘
         │ verify: .figma/component-map.json exists
         ▼
┌─────────────────┐
│  /gen-component  │  Step 3: Generate each component in dependency order
│  (per component) │  Loop: for each in generationOrder[]
└────────┬────────┘
         │ verify: each file exists + tsc passes
         ▼
┌─────────────────┐
│  /gen-page       │  Step 4: Generate each page, composing components
│  (per page)      │
└────────┬────────┘
         │ verify: each page file exists + tsc passes
         ▼
┌─────────────────┐
│  /verify-design  │  Step 5: Compare code vs Figma screenshots
│  (figma-url)     │  Read-only check, outputs PASS/FAIL report
└────────┬────────┘
         │ if FAIL: fix issues, re-verify
         ▼
┌─────────────────┐
│  npm run build   │  Step 6: Final compilation check
└────────┬────────┘
         │
         ▼
    Summary Report
```

## Token Resolution Order

When generating Tailwind classes, resolve values in this order:

1. **Exact theme token match** → `bg-primary`, `text-sm`, `p-4`
2. **Scaled theme token** → `p-2` (if spacing-2 is defined)
3. **Arbitrary value** → `bg-[#F5F5F5]`, `p-[13px]`, `text-[15px]`

Never use:
- Inline styles (`style={{ }}`)
- CSS modules
- Styled-components or other CSS-in-JS

## Component File Naming

| Figma Name | File Name | Export Name |
|---|---|---|
| `Button` | `Button.tsx` | `Button` |
| `Nav Bar` | `NavBar.tsx` | `NavBar` |
| `Card/Product` | `ProductCard.tsx` | `ProductCard` |
| `Icon/Arrow Right` | `ArrowRightIcon.tsx` | `ArrowRightIcon` |

Rules:
- PascalCase for all component names
- Flatten Figma `/` hierarchy into single name (last segment as prefix)
- No `index.ts` barrel exports per component — direct file imports
