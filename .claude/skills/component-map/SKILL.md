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

### Step 4: Find Component Set Parents (MANDATORY for EVERY component instance)

For EVERY component instance found on the page, you MUST trace back to its **component set parent** (the frame in Figma's design system page that contains all variant `<symbol>` children). This is required to discover all variants, download all variant-specific assets, and correctly populate `multiStateVariants`.

**CRITICAL: Page instances only show ONE variant. You CANNOT determine what other variants exist without finding the component set parent. Skipping this step guarantees missing assets and broken multi-state components.**

**How to find the component set parent from a page instance:**

1. Call `figma:get_metadata` on the **root page** (node `0:1`) to get the full file structure
2. Search the output for `<frame>` elements whose `name` matches the component instance name (e.g., instance named "Tab bar" → find `<frame name="Tab bar">`)
3. The correct frame is the one that contains `<symbol>` children (these are the variant master nodes)
4. If there are multiple matching frames, the component set is the `<frame>` that directly contains `<symbol>` children (not the outer wrapper frame)

**Example:**
```
Page instance: <instance id="371:1604" name="Tab bar" ... />

Search file metadata for "Tab bar" → find:
  <frame id="355:2670" name="Tab bar">           ← outer wrapper
    <frame id="355:2583" name="Tab bar">          ← COMPONENT SET (has <symbol> children)
      <symbol id="355:2579" name="State=Home" />  ← variant master node
      <symbol id="355:2580" name="State=Device" />
      <symbol id="355:2581" name="State=Profile" />
      <symbol id="355:2582" name="State=Setting" />
    </frame>
  </frame>

Component set node: 355:2583
Variant master nodes: 355:2579, 355:2580, 355:2581, 355:2582
```

**Record the `componentSetId` in the JSON output for EVERY component** (not just multi-state ones). This makes it easy to go back to the component set later.

### Step 4b: Detect Multi-State Variants

After finding the component set parent (Step 4), check if it has 2+ variants sharing a property axis (e.g., `State=Tab1`, `State=Tab2`, `State=Tab3`).

**Detection procedure:**

1. From Step 4, you already have all `<symbol>` children of the component set
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

### Step 4b: Detect Icon Variant Overrides (Silent Swap Prevention)

For each component analyzed in Step 2, check if it contains Icon sub-components with variant property overrides (e.g., `typeIcon=Door`, `typeIcon=fridge`). This catches a **silent** variant swap bug where MCP returns the same asset URL for different Icon overrides, resulting in only 1 file downloaded instead of N.

**Detection procedure:**

1. In the `get_design_context` output for each component, look for child instances of an `Icon` component with a variant property (e.g., `typeIcon`, `type`, `icon`)
2. Scan ALL page instances of this component — collect every distinct Icon variant value used (e.g., component used twice: once with `typeIcon=Door`, once with `typeIcon=fridge`)
3. For each distinct Icon variant value, find the **variant master node ID** from the Icon component set (use `get_metadata` on the Icon component set to list all `<symbol>` children, match by variant name)

**Record in JSON output** — add an `iconVariants` field for each component that uses Icon variant overrides:

```json
{
  "name": "CardDevice",
  "figmaNodeId": "...",
  "category": "patterns",
  "iconVariants": [
    { "prop": "typeIcon", "value": "Door", "masterNodeId": "48:28266" },
    { "prop": "typeIcon", "value": "fridge", "masterNodeId": "370:1699" }
  ]
}
```

Components without Icon variant overrides should omit the `iconVariants` field entirely.

**Why this matters:** The existing md5 duplicate check only catches the case where 2+ downloaded files have identical content. But if MCP returns the same URL for both variants, only 1 file is downloaded — the md5 check has nothing to compare and silently passes. Recording `iconVariants` here enables `/gen-component` to proactively download each variant from its master node.

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
