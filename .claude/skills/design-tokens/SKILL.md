---
name: design-tokens
description: Extract design tokens from Figma variables and generate Tailwind v4 @theme CSS + TypeScript exports
argument-hint: <figma-url>
disable-model-invocation: true
allowed-tools: figma:get_variable_defs, figma:get_design_context, Read, Write, Edit, Bash
---

# /design-tokens

Extract design tokens from a Figma file and generate:
1. Tailwind v4 `@theme { }` block in `src/index.css`
2. TypeScript token exports in `src/tokens/index.ts`
3. Raw token JSON in `generated/tokens/raw-tokens.json`

## Procedure

### Step 1: Fetch Figma Variables

Call `figma:get_variable_defs` with the provided Figma URL to retrieve all design token variables (colors, typography, spacing, border-radius, shadows, etc.).

### Step 2: Fetch Additional Design Context

Call `figma:get_design_context` on the root frame to capture any additional style definitions (text styles, effect styles, color styles) not covered by variables.

### Step 3: Organize Tokens

Categorize all tokens into these groups:
- **Colors**: All color variables → `--color-{name}: {hex};`
- **Font Families**: All font family values → `--font-{name}: {value};`
- **Font Sizes**: All font size values → `--text-{name}: {value};`
- **Font Weights**: All font weight values → `--font-weight-{name}: {value};`
- **Line Heights**: All line height values → `--leading-{name}: {value};`
- **Spacing**: All spacing values → `--spacing-{name}: {value};`
- **Border Radius**: All radius values → `--radius-{name}: {value};`
- **Shadows**: All shadow/elevation values → `--shadow-{name}: {value};`

### Step 4: Generate `src/index.css`

Update the `@theme { }` block in `src/index.css`. Preserve the `@import "tailwindcss";` at the top. Structure:

```css
@import "tailwindcss";

@theme {
  /* Colors — from Figma variables */
  --color-primary: #XXXXXX;
  --color-secondary: #XXXXXX;
  /* ... */

  /* Typography */
  --font-sans: "Inter", sans-serif;
  --text-xs: 12px;
  --text-sm: 14px;
  /* ... */

  /* Spacing */
  --spacing-1: 4px;
  --spacing-2: 8px;
  /* ... */

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  /* ... */

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  /* ... */
}
```

### Step 5: Generate `src/tokens/index.ts`

Export all tokens as typed TypeScript constants:

```typescript
export const colors = {
  primary: "#XXXXXX",
  secondary: "#XXXXXX",
} as const;

export const fontSizes = {
  xs: "12px",
  sm: "14px",
} as const;

// ... etc for each category
```

### Step 6: Generate `generated/tokens/raw-tokens.json`

Save the complete raw token data as JSON for reference and debugging.

### Step 7: Verify

Run `npx vite build` to confirm the project still compiles with the new tokens.

## Rules

- **Exact values only**: Use the exact hex codes, pixel values, and font names from Figma. Never round, approximate, or substitute.
- **Figma names as comments**: Include the original Figma variable name as a comment next to each token when the CSS name differs.
- **No invented tokens**: Only output tokens that exist in the Figma file. Do not add defaults, fallbacks, or "common" tokens.
- **Preserve collections**: If Figma has token collections (e.g., "Light", "Dark"), preserve them as separate groups with clear naming (e.g., `--color-light-primary`, `--color-dark-primary`).
