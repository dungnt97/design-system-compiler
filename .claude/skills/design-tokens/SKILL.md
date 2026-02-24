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

## CRITICAL: Tailwind v4 `@theme` Variable Namespaces

Tailwind v4 maps CSS custom properties to utility classes **by namespace prefix**. Using the wrong prefix means the token silently falls back to Tailwind defaults — no error, no warning, just wrong values at runtime.

### Namespace Reference (MANDATORY)

Every token MUST use the exact namespace below. No exceptions.

| Token type | CORRECT namespace | Utility class | WRONG (silently ignored) |
|---|---|---|---|
| Colors | `--color-{name}: {hex}` | `bg-{name}`, `text-{name}`, `border-{name}` | `--bg-*`, `--background-*` |
| Font family | `--font-{name}: {value}` | `font-{name}` | `--font-family-*` |
| Font size | `--text-{name}: {value}` | `text-{name}` | `--font-size-*`, `--size-*` |
| Font size + line-height | `--text-{name}--line-height: {value}` | (auto with `text-{name}`) | `--text-{name}-line-height` (missing double dash) |
| Line height | `--leading-{name}: {value}` | `leading-{name}` | `--line-height-*`, `--lh-*` |
| Letter spacing | `--tracking-{name}: {value}` | `tracking-{name}` | `--letter-spacing-*` |
| Font weight | `--font-weight-{name}: {value}` | `font-{name}` | `--weight-*` |
| Spacing | `--spacing-{name}: {value}` | `p-{name}`, `m-{name}`, `gap-{name}` | `--space-*`, `--gap-*` |
| Border radius | `--radius-{name}: {value}` | `rounded-{name}` | `--border-radius-*`, `--rounded-*` |
| Shadows | `--shadow-{name}: {value}` | `shadow-{name}` | `--box-shadow-*` |

### Compound Font Size + Line Height

When a text style in Figma has both font-size and line-height, generate BOTH the font-size token AND a compound line-height token:

```css
/* CORRECT — text-lg sets font-size:24px AND line-height:48px automatically */
--text-lg: 24px;
--text-lg--line-height: 48px;

/* Also define standalone leading for override use */
--leading-lg: 48px;
```

The compound `--text-{name}--line-height` (note: DOUBLE dash before `line-height`) makes `text-lg` automatically set both `font-size` and `line-height`. The standalone `--leading-lg` allows overriding line-height independently via `leading-lg`.

### Why This Matters

```css
/* WRONG — --font-size-lg is NOT a Tailwind v4 namespace */
@theme {
  --font-size-lg: 24px;     /* ← Just a CSS variable, not connected to any utility */
  --line-height-lg: 48px;   /* ← Same — leading-lg utility won't find this */
}
/* Result: text-lg → 18px (Tailwind default), leading-lg → no effect */

/* CORRECT */
@theme {
  --text-lg: 24px;                /* ← Overrides default --text-lg (was 1.125rem/18px) */
  --text-lg--line-height: 48px;   /* ← text-lg now sets line-height:48px automatically */
  --leading-lg: 48px;             /* ← leading-lg utility works independently */
}
/* Result: text-lg → 24px + 48px line-height ✓ */
```

## Procedure

### Step 1: Fetch Figma Variables

Call `figma:get_variable_defs` with the provided Figma URL to retrieve all design token variables (colors, typography, spacing, border-radius, shadows, etc.).

### Step 2: Fetch Additional Design Context

Call `figma:get_design_context` on the root frame to capture any additional style definitions (text styles, effect styles, color styles) not covered by variables.

### Step 3: Organize Tokens

Categorize all tokens into these groups, using the **exact namespace** from the reference table above:

- **Colors**: `--color-{name}: {hex};`
- **Font Families**: `--font-{name}: {value};`
- **Font Sizes**: `--text-{name}: {value};` + `--text-{name}--line-height: {value};`
- **Font Weights**: `--font-weight-{name}: {value};`
- **Line Heights**: `--leading-{name}: {value};`
- **Spacing**: `--spacing-{name}: {value};`
- **Border Radius**: `--radius-{name}: {value};`
- **Shadows**: `--shadow-{name}: {value};`

For every Figma text style that has both font-size and line-height, generate:
1. `--text-{name}: {font-size}` — the font size
2. `--text-{name}--line-height: {line-height}` — compound line-height (double dash!)
3. `--leading-{name}: {line-height}` — standalone line-height

### Step 4: Generate `src/index.css`

Update the `@theme { }` block in `src/index.css`. Preserve any existing `@import` statements above it (Google Fonts MUST come before `@import "tailwindcss"`).

```css
@import url("https://fonts.googleapis.com/css2?family=...");
@import "tailwindcss";

@theme {
  /* Colors */
  --color-primary: #0056B1;
  --color-black: #000000;
  /* ... */

  /* Font Family */
  --font-sans: "Inter", sans-serif;

  /* Font Size + compound line-height */
  --text-xs: 12px;
  --text-xs--line-height: 16px;
  --text-sm: 14px;
  --text-sm--line-height: 20px;
  --text-md: 16px;
  --text-md--line-height: 24px;
  --text-lg: 24px;
  --text-lg--line-height: 48px;

  /* Line Height (standalone) */
  --leading-xs: 16px;
  --leading-sm: 20px;
  --leading-md: 24px;
  --leading-lg: 48px;

  /* Font Weight */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

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
  primary: "#0056B1",
  secondary: "#XXXXXX",
} as const;

export const fontSize = {
  xs: "12px",
  sm: "14px",
} as const;

// ... etc for each category
```

### Step 6: Generate `generated/tokens/raw-tokens.json`

Save the complete raw token data as JSON for reference and debugging.

### Step 7: Build Verification

Run `npx vite build` to confirm the project compiles with the new tokens.

### Step 8: Token Resolution Verification

After building, verify that critical tokens actually resolve correctly by checking the CSS output:

```bash
# Extract token values from built CSS to confirm they override defaults
cat dist/assets/*.css | tr ';' '\n' | tr '{' '\n' | grep -E '^--(text-|leading-)' | head -20
```

Check that:
- [ ] `--text-lg` shows your custom value (NOT the Tailwind default `1.125rem`)
- [ ] `--text-sm` shows your custom value (NOT `0.875rem`)
- [ ] `--leading-*` tokens are present (NOT absent)
- [ ] `--text-*--line-height` compound tokens are present

If any token shows a Tailwind default instead of your custom value, the namespace is WRONG — go back to Step 3 and fix it.

## Rules

- **Exact values only**: Use the exact hex codes, pixel values, and font names from Figma. Never round, approximate, or substitute.
- **Figma names as comments**: Include the original Figma variable name as a comment next to each token when the CSS name differs.
- **No invented tokens**: Only output tokens that exist in the Figma file. Do not add defaults, fallbacks, or "common" tokens.
- **Preserve collections**: If Figma has token collections (e.g., "Light", "Dark"), preserve them as separate groups with clear naming (e.g., `--color-light-primary`, `--color-dark-primary`).
- **NEVER use `--font-size-*`**: Use `--text-*` (Tailwind v4 namespace for font sizes).
- **NEVER use `--line-height-*`**: Use `--leading-*` (Tailwind v4 namespace for line heights).
- **NEVER use `--letter-spacing-*`**: Use `--tracking-*` (Tailwind v4 namespace for letter spacing).
- **NEVER use `--border-radius-*`**: Use `--radius-*` (Tailwind v4 namespace for border radius).
- **ALWAYS generate compound line-heights**: Every `--text-{name}` MUST have a matching `--text-{name}--line-height`.
