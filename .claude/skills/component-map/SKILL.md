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

### Step 4: Build Dependency Graph

For each component, list:
- `dependsOn`: Components it uses as children
- `usedBy`: Components that use it as a child

### Step 5: Determine Generation Order

Topologically sort components so that dependencies are generated before dependents:
1. All `ui` (atomic) components first, sorted by dependency count (fewest first)
2. Then `patterns` (composite) components, sorted by dependency depth

### Step 6: Output Component Map

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

### Step 7: Summary

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
