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

#### CRITICAL: Frame Dimensions

The page's root `<div>` MUST use the **exact Figma frame dimensions** as fixed width and height:

```tsx
// Figma frame is 375×812 (mobile) → use exact dimensions
<div className="relative h-[812px] w-[375px] bg-{background}">
```

**NEVER use `size-full`, `w-full`, `h-full`, or `min-h-screen` on the page root.** These make the page expand to fill the browser viewport, which does NOT match the Figma design. The Figma frame has specific pixel dimensions — use them.

#### CRITICAL: Container Positioning

When the Figma design has a container inside the frame with padding/offsets:
- Calculate the **exact pixel offsets** from the frame edges: `left-[{x}px] top-[{y}px]`
- Use the **exact container dimensions**: `w-[{width}px] h-[{height}px]`
- Do NOT use `left-1/2 -translate-x-1/2` centering unless the container is truly centered and you've verified the math

Example: Frame 375×812, container at x=24, y=44, size 327×734:
```tsx
<div className="absolute left-[24px] top-[44px] flex h-[734px] w-[327px] flex-col ...">
```

#### CRITICAL: Full-Width Children

When component instances in Figma span the full container width (e.g., a Button that is 327px wide in a 327px container):
- Pass `w-full` to the component, NOT a fixed pixel width
- The container already constrains the width — children should fill it with `w-full`

Example — Button that fills 327px container:
```tsx
{/* CORRECT — fills parent width */}
<Button className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-2">

{/* WRONG — no width, wraps to content */}
<Button className="flex items-center justify-center rounded-full bg-primary px-4 py-2">
```

Example — Input that fills container:
```tsx
{/* CORRECT — fills parent width */}
<Input className="flex w-full flex-col items-start gap-1" />

{/* WRONG — hardcoded Figma width, breaks in different contexts */}
<Input className="flex w-[327px] flex-col items-start gap-1" />
```

#### CRITICAL: Section Widths

Every direct child section of the container should use `w-full` to fill the container width, not repeat the container's pixel width:
```tsx
{/* Container is 327px */}
<div className="... w-[327px] ...">
  {/* Children use w-full to fill it */}
  <div className="flex w-full flex-col gap-6">
    <div className="flex w-full flex-col gap-3">
```

#### Layout Rules

| Figma Layout | Code Output |
|---|---|
| Top-level frame | Root `<div>` with **exact pixel dimensions** `w-[Xpx] h-[Ypx]` |
| Container with offsets | `absolute left-[Xpx] top-[Ypx] w-[Wpx] h-[Hpx]` |
| Children filling container | `w-full` (NOT repeating parent's pixel width) |
| Sections stacked vertically | `flex flex-col` with `gap-{n}` |
| Sidebar + content | `flex flex-row` with appropriate widths |
| Grid of cards | `grid grid-cols-{n} gap-[{px}px]` |
| Absolute positioned elements | `relative` parent + `absolute` children |
| Full-width component | Pass `w-full` in className prop |

### Step 7: Handle Missing Components

If the page uses components that haven't been generated yet:
1. Check if it's a simple element (text, image, divider) → inline it directly
2. If it's a reusable component → generate it as a separate file using the same rules as `/gen-component`, then import it

### Step 8: Update App.tsx

Update `src/App.tsx` to render the new page. Wrap it in a centered viewport container so the fixed-dimension page frame is centered on screen:

```tsx
import { PageName } from "@/pages/PageName";

export default function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e5e5e5]">
      <PageName />
    </div>
  );
}
```

This ensures the mobile frame (e.g., 375×812) is visually centered in the browser viewport, not stretched to fill it.

### Step 9: Semantic HTML Check

Verify that all interactive elements in the page use correct semantic HTML, not just visual `<div>` wrappers:

- Input fields rendered as `<input>` (not `<div><p>placeholder</p></div>`)
- Buttons rendered as `<button>` (not `<div><p>label</p></div>`)
- Clickable text rendered as `<button>` or `<a>` (not `<div><p>text</p></div>`)

If the page inlines any input/button elements directly (instead of using a generated component), they MUST use proper semantic HTML. See `/gen-component` SKILL.md "Semantic HTML for Interactive Elements" section for full rules.

### Step 10: Asset Path Check

Verify that NO Figma MCP asset URLs (`figma.com/api/mcp/asset/*`) appear in the page code. All images/icons should reference local paths (`/assets/{filename}`). If any Figma URLs remain, download them:

```bash
curl -sL -o public/assets/{filename} "{figma-url}"
```

### Step 11: Visual Verification

Compare the generated page against the Figma screenshot section by section:
- Overall layout matches (frame dimensions, container positioning)
- All sections are present in correct order
- Spacing between sections matches
- Component instances use correct props/variants
- **Full-width elements actually fill the container** (no content-wrapping buttons or inputs)
- **Interactive elements are functional** (inputs focusable, buttons clickable)

### Step 12: Build Check

Run `npx tsc --noEmit` to verify the page compiles without errors.

## Rules

- **Exact frame dimensions**: The page root div MUST match the Figma frame's exact pixel width and height. Never use relative sizing (size-full, w-full, min-h-screen) on the page root.
- **Exact container positioning**: Use exact pixel offsets (left, top) for the main container, not centered transforms.
- **Width flows down via `w-full`**: The container sets the width. All children use `w-full` to fill it. Never repeat a parent's pixel width on children.
- **Components fill their parents**: When placing a component, pass `w-full` in its className if it should span the full parent width.
- **Compose, don't duplicate**: If a generated component exists in `src/components/`, import and use it. Don't re-implement its internals inline.
- **Section-by-section**: Process the page in sections to maintain accuracy. Don't try to generate the entire page from a single context fetch.
- **Real content**: Use the exact text content, image URLs, and data shown in Figma. Don't substitute with placeholders.
- **Responsive**: Only implement responsive behavior if explicitly shown in Figma (e.g., multiple frame sizes). Don't invent responsive breakpoints.
- **Background & decorations**: Include all background colors, gradients, images, dividers, and decorative elements exactly as shown.

### CRITICAL: Inline Elements Must Be Semantic

When the page inlines elements directly (e.g., two inputs side-by-side that aren't using a generated `<Input>` component), always use the correct semantic HTML:

| Element | Correct | Wrong |
|---|---|---|
| Input field | `<input type="text" placeholder="..." className="..." />` | `<div><p>Placeholder</p></div>` |
| Button | `<button className="...">Label</button>` | `<div><p>Label</p></div>` |
| Link | `<a href="#" className="...">Text</a>` | `<div><p>Text</p></div>` |

This is especially important for inline input elements that aren't using the generated `<Input>` component. The inner `<p>` tag holding placeholder text MUST be replaced with an `<input>` element with a `placeholder` attribute.

### CRITICAL: Instance Text Width

When reusing a component instance with different text content than the original template (e.g., using a "Resend OTP" component for "Login" text), do NOT pass the template's fixed width. The text container should use `w-fit` or omit width entirely so it sizes to the actual text content.
