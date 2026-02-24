---
name: component-map
description: Analyze Figma components and generate a dependency graph with generation order
argument-hint: <figma-url>
disable-model-invocation: true
allowed-tools: figma:get_metadata, figma:get_design_context, Read, Write, Edit
---

# /component-map

Analyze all components in a Figma file and produce a structured component map with dependency graph and generation order.

## Procedure

### Step 1: Fetch Figma Metadata

Call `figma:get_metadata` with the provided Figma URL to get a sparse map of all pages, frames, and components in the file.

### Step 2: Analyze Component Details

For each component set found in Step 1, call `figma:get_design_context` to understand:
- Component name and description
- All variants and their properties
- Props (text content, boolean toggles, instance swaps)
- Child components used (dependencies)
- Visual structure (layout type, dimensions)

### Step 3: Classify Components

Categorize each component:
- **`ui`** (atomic): No child component dependencies, or only depends on native elements. Examples: Button, Input, Badge, Avatar, Icon.
- **`patterns`** (composite): Depends on other components. Examples: Card, Navbar, FormField, Modal, Dropdown.

### Step 4: Detect Component Set Variants (Multi-State)

For each component instance found on the page, check if its **component set** (parent frame containing variant `<symbol>` children) has 2+ variants sharing a property axis (e.g., `State=Tab1`, `State=Tab2`, `State=Tab3`).

**Detection procedure:**

1. Use `figma:get_metadata` on the component set node to list all child `<symbol>` variants
2. Parse variant names for a shared property axis (e.g., `State=Home` → property: `State`, value: `Home`)
3. If the component set has 2+ variants on the same property axis, this is a **multi-state component**

**Record in JSON output** — add a `multiStateVariants` field for each multi-state component:

```json
{
  "name": "{ComponentName}",
  "figmaNodeId": "{instance-node-id}",
  "category": "patterns",
  "componentSetId": "{component-set-node-id}",
  "multiStateVariants": {
    "property": "{PropertyName}",
    "values": [
      { "name": "{Value1}", "nodeId": "{variant-1-node-id}" },
      { "name": "{Value2}", "nodeId": "{variant-2-node-id}" },
      { "name": "{Value3}", "nodeId": "{variant-3-node-id}" }
    ]
  }
}
```

Components without multi-state variants should omit the `multiStateVariants` field entirely.

**Note:** `multiStateVariants` is distinct from the existing `variants` array (which records styling variants like Primary/Secondary). `multiStateVariants` tracks runtime-switchable states that require state management props and variant-specific assets.

**Why this matters:** Multi-state components often have variant-specific assets (e.g., a different background SVG per tab) and require state management props (`activeTab`, `onTabChange`). Without detecting variants here, `/gen-component` will only generate for a single variant, missing assets and state logic.

### Step 5: Build Dependency Graph

For each component, list:
- `dependsOn`: Components it uses as children
- `usedBy`: Components that use it as a child

### Step 6: Determine Generation Order

Topologically sort components so that dependencies are generated before dependents:
1. All `ui` (atomic) components first, sorted by dependency count (fewest first)
2. Then `patterns` (composite) components, sorted by dependency depth

### Step 7: Output Component Map

Write `.figma/component-map.json`:

```json
{
  "fileKey": "...",
  "fileName": "...",
  "generatedAt": "ISO timestamp",
  "components": [
    {
      "name": "Button",
      "figmaNodeId": "1:234",
      "figmaUrl": "...",
      "category": "ui",
      "variants": [
        { "name": "Primary", "props": { "size": "md", "variant": "primary" } },
        { "name": "Secondary", "props": { "size": "md", "variant": "secondary" } }
      ],
      "props": ["variant", "size", "disabled", "children"],
      "dependsOn": [],
      "usedBy": ["Card", "Modal"],
      "generationOrder": 1
    },
    {
      "name": "BottomNav",
      "figmaNodeId": "10:500",
      "figmaUrl": "...",
      "category": "patterns",
      "componentSetId": "10:400",
      "multiStateVariants": {
        "property": "State",
        "values": [
          { "name": "Tab1", "nodeId": "10:401" },
          { "name": "Tab2", "nodeId": "10:402" },
          { "name": "Tab3", "nodeId": "10:403" }
        ]
      },
      "variants": [],
      "props": ["activeTab", "onTabChange"],
      "dependsOn": [],
      "usedBy": ["Dashboard"],
      "generationOrder": 3
    },
    {
      "name": "Card",
      "figmaNodeId": "5:678",
      "figmaUrl": "...",
      "category": "patterns",
      "variants": [],
      "props": ["title", "description", "image", "actions"],
      "dependsOn": ["Button", "Badge"],
      "usedBy": ["ProductList"],
      "generationOrder": 5
    }
  ],
  "generationOrder": ["Icon", "Badge", "Avatar", "Button", "Input", "Card", "Navbar", "Modal"]
}
```

### Step 8: Summary

Print a summary table to the user:
- Total components found
- `ui` count vs `patterns` count
- Generation order list
- Any circular dependencies detected (warn, don't fail)

## Rules

- **Include ALL components**: Don't skip components that seem trivial or redundant. If Figma has it, map it.
- **Preserve Figma names**: Use the exact component names from Figma. Don't rename to "better" conventions.
- **Detect nested instances**: If a component uses another component as a child instance, that's a dependency.
- **Handle component sets**: Figma component sets (variants) should be treated as a single component with multiple variants, not separate components.
