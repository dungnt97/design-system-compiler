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

### Step 5: Download Image Assets

For every image/SVG asset URL from Figma MCP (URLs matching `figma.com/api/mcp/asset/*`):

1. Create the directory `public/assets/` if it doesn't exist
2. Download each asset using `curl -sL -o public/assets/{filename} {url}`
3. Name files descriptively: `icon-arrow.svg`, `icon-eye-open.svg`, `logo-part-1.png`, etc.
4. Replace all Figma MCP URLs in the component code with local paths: `/assets/{filename}`

This is CRITICAL because Figma MCP asset URLs expire after 7 days. Local assets ensure the app works permanently.

Example:
```bash
# Download
curl -sL -o public/assets/icon-eye-open.svg "https://www.figma.com/api/mcp/asset/abc123"

# In code: use local path
const imgIconEyeOpen = "/assets/icon-eye-open.svg";
```

### Step 6: Generate Component

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

### Step 7: Visual Verification

Compare the generated code structure against the Figma screenshot:
- Layer hierarchy should match
- All visual elements should be present
- No extra or missing elements

### Step 8: Build Check

Run `npx tsc --noEmit` to verify the component compiles without TypeScript errors.

## Rules

- **1:1 translation**: Every Figma layer becomes a corresponding JSX element. Don't merge layers, skip "decorative" elements, or restructure.
- **Preserve layer hierarchy**: If Figma has Frame > Frame > Text, the output should have div > div > span (or appropriate semantic element).
- **All states**: Implement hover, active, focus, disabled states if shown in Figma variants using Tailwind modifiers (`hover:`, `focus:`, `active:`, `disabled:`).
- **Text content**: Use the exact text content from Figma as default prop values. Don't replace with "Lorem ipsum" or generic placeholders.
- **Icons**: If the component contains icons, represent them as an `icon` prop or import from an icons directory. Note the exact icon in a comment.
- **No extra features**: Don't add onClick handlers, aria labels, animations, or functionality not explicitly shown in the Figma design.
- **Token preference**: Always check `src/index.css` `@theme` tokens first. Use arbitrary values `[...]` only when no token matches.

### CRITICAL: Semantic HTML for Interactive Elements

Figma designs are visual — they don't distinguish between interactive and static elements. But generated code MUST use correct semantic HTML elements so the UI is functional and accessible:

| Figma Element | Correct HTML | WRONG HTML |
|---|---|---|
| Input field (text entry area with placeholder) | `<input type="text" placeholder="..." className="..." />` | `<div><p>Placeholder</p></div>` |
| Password field | `<input type="password" placeholder="..." />` | `<div><p>Password</p></div>` |
| Email field | `<input type="email" placeholder="..." />` | `<div><p>Email</p></div>` |
| Button (clickable action) | `<button className="...">Label</button>` | `<div><p>Label</p></div>` |
| Link text (navigates somewhere) | `<a href="#" className="...">Text</a>` or `<button className="...">Text</button>` | `<div><p>Text</p></div>` |

**Rules for semantic translation:**

1. **Input components**: The inner field area (the rectangle with placeholder text) MUST be an `<input>` element. Apply all Tailwind styling classes directly to the `<input>`. Use the `placeholder` attribute for placeholder text. Remove the inner `<p>` that holds placeholder text — `<input placeholder="...">` replaces it.

Example:
```tsx
// CORRECT — functional input
<div className="flex h-[40px] w-full items-center rounded-full border border-neutral-300 bg-white px-4 py-2">
  <input
    type="text"
    placeholder="Email"
    className="w-full flex-1 bg-transparent font-sans text-sm font-medium leading-base text-black placeholder:text-neutral-500 outline-none"
  />
</div>

// WRONG — non-interactive div
<div className="flex h-[40px] w-full items-center rounded-full border ...">
  <p className="text-neutral-500">Email</p>
</div>
```

2. **Button components**: The clickable container MUST be a `<button>` element, not a `<div>`. Text inside should be a `<span>` or direct text node, not a `<p>`. ALL `<button>` elements MUST include:
   - `type="button"` attribute (prevents accidental form submission)
   - `cursor-pointer` class (HTML buttons default to `cursor: default`, which feels unclickable)
   - Focus styles: `focus:outline-none focus:ring-2 focus:ring-primary`

Example:
```tsx
// CORRECT — functional, interactive button
<button type="button" className="flex w-full cursor-pointer items-center justify-center rounded-full bg-primary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
  <span className="font-sans text-base font-medium leading-base text-white">Sign up</span>
</button>

// WRONG — non-interactive div
<div className="flex w-full items-center justify-center rounded-full bg-primary ...">
  <p className="text-white">Sign up</p>
</div>

// ALSO WRONG — button without cursor-pointer or focus styles (looks/feels unclickable)
<button className="flex w-full items-center justify-center rounded-full bg-primary ...">
  <p className="text-white">Sign up</p>
</button>
```

3. **Link/action text**: Clickable text (like "Login", "Forgot password?", etc.) MUST be wrapped in `<button>` or `<a>`. If it navigates to another page, use `<a>`. If it triggers an action, use `<button>`. MUST include `type="button"`, `cursor-pointer`, and focus styles.

4. **Interactive element required attributes**: ALL interactive elements (`<button>`, `<a>`, `<input>`) MUST include:
   - `cursor-pointer` class (makes the element feel clickable)
   - `focus:outline-none focus:ring-2 focus:ring-primary` (visible focus ring, since Tailwind v4 preflight removes browser default outlines)
   - For `<button>`: `type="button"` attribute
   - Without these, buttons and links appear non-interactive even though they use semantic HTML

5. **Input type detection**: Detect the correct `type` attribute from the placeholder/label text:
   - "Email" → `type="email"`
   - "Password" / "Confirm password" → `type="password"`
   - "Phone number" → `type="tel"`
   - Everything else → `type="text"`

### CRITICAL: Composability Rules

- **Use `w-full` in inner wrappers, not fixed widths**: When a component accepts a `className` prop for its outer container, the inner content wrapper MUST use `w-full` instead of a fixed pixel width (e.g., `w-[327px]`). Fixed inner widths break the component when it's placed in flex layouts with `flex-1`. The parent (via className) controls the width, the component fills it.
- **Components must be width-agnostic**: A component that works at 327px must also work at 157px when placed in a flex row. Never hardcode the Figma artboard width inside a reusable component.
- **Test mentally in flex context**: Before finalizing, consider: "If this component is placed with `flex-1` in a row, will it still work?" If it has a hardcoded inner width, the answer is no — fix it.

### CRITICAL: Instance Dimensions vs Component Template Dimensions

When a component instance in a page has different dimensions than the component template (e.g., a "Resend OTP" component reused as "Login" text), use `w-fit` or `w-auto` for text containers instead of the template's fixed width. The fixed width was designed for the original text content, not the instance's text.

Example:
```tsx
// CORRECT — fits actual text content
<div className="font-sans text-xs font-bold text-primary">
  <p className="leading-sm">Login</p>
</div>

// WRONG — uses template width for "Resend OTP" (82px) which is too wide for "Login"
<div className="w-[82px] font-sans text-xs font-bold text-primary">
  <p className="leading-sm">Login</p>
</div>
```

### CRITICAL: Download All Figma Assets Locally

NEVER leave Figma MCP asset URLs (`figma.com/api/mcp/asset/*`) in generated code. They expire after 7 days. Always download to `public/assets/` and use local paths.
