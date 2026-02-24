---
name: gen-component
description: Generate a single React + TypeScript + Tailwind component from a Figma component
argument-hint: <figma-url>
disable-model-invocation: true
allowed-tools: figma:get_design_context, figma:get_screenshot, Read, Write, Edit, Bash
---

# /gen-component

Generate a single React + TypeScript component with Tailwind CSS classes from a Figma component node.

## Procedure

### Step 1: Fetch Design Context

Call `figma:get_design_context` with the provided Figma URL to get complete layout, style, and hierarchy information for the component.

### Step 2: Fetch Screenshot

Call `figma:get_screenshot` with the Figma URL to get a visual reference of the component.

### Step 3: Read Existing Tokens

Read `src/index.css` to understand available `@theme` tokens. All generated Tailwind classes should use these tokens where possible.

### Step 4: Read Component Map (if exists)

If `.figma/component-map.json` exists, read it to understand:
- Where this component fits in the dependency graph
- What category it belongs to (`ui` or `patterns`)
- What child components it depends on (import them)

### Step 5: Generate Component

Create the React component file following these rules:

#### File Location
- `ui` components → `src/components/ui/{ComponentName}.tsx`
- `patterns` components → `src/components/patterns/{ComponentName}.tsx`

#### Component Structure

```tsx
import { type ComponentProps } from "react";
// Import child components if this is a pattern

interface {ComponentName}Props {
  // Props derived from Figma variants and configurable properties
}

export function {ComponentName}({ ...props }: {ComponentName}Props) {
  return (
    // JSX matching Figma layer hierarchy exactly
  );
}
```

#### Translation Rules

| Figma Property | React/Tailwind Output |
|---|---|
| Auto Layout (horizontal) | `flex flex-row` |
| Auto Layout (vertical) | `flex flex-col` |
| Auto Layout gap | `gap-{token}` or `gap-[{px}px]` |
| Auto Layout padding | `p-{token}` or `px-[{px}px] py-[{px}px]` |
| Fill container | `flex-1` or `w-full` / `h-full` |
| Hug contents | `w-fit` / `h-fit` (or omit for default) |
| Fixed width/height | `w-[{px}px]` / `h-[{px}px]` |
| Absolute position | `absolute top-[{px}px] left-[{px}px]` |
| Background color | `bg-{token}` or `bg-[{hex}]` |
| Text color | `text-{token}` or `text-[{hex}]` |
| Font size | `text-{token}` or `text-[{px}px]` |
| Font weight | `font-{weight}` |
| Font family | `font-{token}` |
| Line height | `leading-{token}` or `leading-[{value}]` |
| Letter spacing | `tracking-[{value}]` |
| Border radius | `rounded-{token}` or `rounded-[{px}px]` |
| Border | `border border-[{hex}]` with `border-[{px}px]` |
| Shadow | `shadow-{token}` or `shadow-[{value}]` |
| Opacity | `opacity-{value}` |
| Overflow hidden | `overflow-hidden` |
| Text align | `text-left` / `text-center` / `text-right` |

#### Variant Handling

If the component has variants in Figma:
1. Create a prop for each variant axis (e.g., `variant`, `size`, `state`)
2. Use conditional classes (ternary or object mapping) to switch styles
3. Define all variant combinations as a type union

Example:
```tsx
const variantStyles = {
  primary: "bg-primary text-white",
  secondary: "bg-secondary text-primary",
} as const;

type Variant = keyof typeof variantStyles;
```

### Step 6: Visual Verification

Compare the generated code structure against the Figma screenshot:
- Layer hierarchy should match
- All visual elements should be present
- No extra or missing elements

### Step 7: Build Check

Run `npx tsc --noEmit` to verify the component compiles without TypeScript errors.

## Rules

- **1:1 translation**: Every Figma layer becomes a corresponding JSX element. Don't merge layers, skip "decorative" elements, or restructure.
- **Preserve layer hierarchy**: If Figma has Frame > Frame > Text, the output should have div > div > span (or appropriate semantic element).
- **All states**: Implement hover, active, focus, disabled states if shown in Figma variants using Tailwind modifiers (`hover:`, `focus:`, `active:`, `disabled:`).
- **Text content**: Use the exact text content from Figma as default prop values. Don't replace with "Lorem ipsum" or generic placeholders.
- **Icons**: If the component contains icons, represent them as an `icon` prop or import from an icons directory. Note the exact icon in a comment.
- **No extra features**: Don't add onClick handlers, aria labels, animations, or functionality not explicitly shown in the Figma design.
- **Token preference**: Always check `src/index.css` `@theme` tokens first. Use arbitrary values `[...]` only when no token matches.
