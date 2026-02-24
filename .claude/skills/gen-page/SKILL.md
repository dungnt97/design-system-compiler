---
name: gen-page
description: Generate a full page from a Figma frame, composing existing components
argument-hint: <figma-url>
disable-model-invocation: true
allowed-tools: figma:get_metadata, figma:get_design_context, figma:get_screenshot, Read, Write, Edit, Bash
---

# /gen-page

Generate a complete page component from a Figma frame, composing existing components and generating missing ones inline.

## Procedure

### Step 1: Fetch Page Metadata

Call `figma:get_metadata` with the provided Figma URL to get a sparse overview of the page structure — all top-level sections and component instances.

### Step 2: Fetch Screenshot

Call `figma:get_screenshot` with the Figma URL to get a full visual reference of the page.

### Step 3: Read Existing Components

Read the component map from `.figma/component-map.json` (if exists) and scan `src/components/` to understand what components are already generated.

### Step 4: Fetch Design Context Per Section

For each major section of the page, call `figma:get_design_context` to get detailed layout and style information. Break large pages into sections to stay within context limits:
- Header / Navigation
- Hero / Banner
- Content sections
- Sidebar (if any)
- Footer

### Step 5: Read Existing Tokens

Read `src/index.css` to understand available `@theme` tokens for class generation.

### Step 6: Generate Page Component

Create the page file at `src/pages/{PageName}.tsx`:

```tsx
import { ComponentA } from "@/components/ui/ComponentA";
import { ComponentB } from "@/components/patterns/ComponentB";

export function {PageName}() {
  return (
    // Page layout matching Figma exactly
  );
}
```

#### Layout Rules

| Figma Layout | Code Output |
|---|---|
| Top-level frame | Root `<div>` with exact dimensions or responsive equivalents |
| Sections stacked vertically | `flex flex-col` or direct children |
| Sidebar + content | `flex flex-row` with appropriate widths |
| Grid of cards | `grid grid-cols-{n} gap-[{px}px]` |
| Absolute positioned elements | `relative` parent + `absolute` children |
| Full-width sections | `w-full` with internal max-width container if applicable |

### Step 7: Handle Missing Components

If the page uses components that haven't been generated yet:
1. Check if it's a simple element (text, image, divider) → inline it directly
2. If it's a reusable component → generate it as a separate file using the same rules as `/gen-component`, then import it

### Step 8: Add Page to App Router

Update `src/App.tsx` to include the new page. If this is the first page, make it the default route. If multiple pages exist, add simple routing.

### Step 9: Visual Verification

Compare the generated page against the Figma screenshot section by section:
- Overall layout matches
- All sections are present in correct order
- Spacing between sections matches
- Component instances use correct props/variants

### Step 10: Build Check

Run `npx tsc --noEmit` to verify the page compiles without errors.

## Rules

- **Exact layout**: Preserve the exact layout structure from Figma — flex directions, grid configurations, absolute positioning, spacing, and dimensions.
- **Compose, don't duplicate**: If a generated component exists in `src/components/`, import and use it. Don't re-implement its internals inline.
- **Section-by-section**: Process the page in sections to maintain accuracy. Don't try to generate the entire page from a single context fetch.
- **Real content**: Use the exact text content, image URLs, and data shown in Figma. Don't substitute with placeholders.
- **Responsive**: Only implement responsive behavior if explicitly shown in Figma (e.g., multiple frame sizes). Don't invent responsive breakpoints.
- **Background & decorations**: Include all background colors, gradients, images, dividers, and decorative elements exactly as shown.
