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

## CRITICAL: Tailwind v4 `@theme` Variable Namespaces

Tailwind v4 only recognizes specific CSS custom property prefixes. Wrong prefixes silently fall back to defaults — no error, no warning.

| Token type | CORRECT prefix | WRONG (silently ignored) |
|---|---|---|
| Font size | `--text-*` | ~~`--font-size-*`~~ |
| Line height | `--leading-*` | ~~`--line-height-*`~~ |
| Letter spacing | `--tracking-*` | ~~`--letter-spacing-*`~~ |
| Border radius | `--radius-*` | ~~`--border-radius-*`~~ |
| Colors | `--color-*` | (correct) |
| Font family | `--font-*` | (correct) |
| Font weight | `--font-weight-*` | (correct) |
| Spacing | `--spacing-*` | (correct) |

Font sizes MUST include compound line-height: `--text-lg: 24px` + `--text-lg--line-height: 48px`

See `.claude/skills/design-tokens/SKILL.md` for the full namespace reference.

## Token Resolution Order

When generating Tailwind classes, resolve values in this order:

1. **Exact theme token match** → `bg-primary`, `text-sm`, `p-4`
2. **Scaled theme token** → `p-2` (if spacing-2 is defined)
3. **Arbitrary value** → `bg-[#F5F5F5]`, `p-[13px]`, `text-[15px]`

Never use:
- Inline styles (`style={{ }}`) — exception: CSS `maskImage` for SVG assets
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

## CRITICAL: Width & Dimension Rules

These rules prevent the most common fidelity bugs. Violating them causes visible differences from the Figma design.

### Page Root = Exact Figma Frame Dimensions

```tsx
// CORRECT — exact Figma frame dimensions
<div className="relative h-[812px] w-[375px] bg-neutral-100">

// WRONG — expands to fill browser viewport
<div className="relative size-full bg-neutral-100">
<div className="relative min-h-screen w-full bg-neutral-100">
```

### Container = Exact Pixel Position + Dimensions

```tsx
// CORRECT — exact position from Figma metadata (x=24, y=44, w=327, h=734)
<div className="absolute left-[24px] top-[44px] w-[327px] h-[734px] flex flex-col">

// WRONG — centering transform (loses precise positioning)
<div className="absolute left-1/2 top-[44px] -translate-x-1/2 flex flex-col">
```

### Children = `w-full`, NOT Parent's Pixel Width

```tsx
// CORRECT — children fill their parent
<div className="w-[327px] ...">        {/* container sets width */}
  <div className="w-full ...">          {/* child fills it */}
    <Input className="w-full ..." />    {/* component fills parent */}
    <Button className="w-full ..." />   {/* button fills parent */}
  </div>
</div>

// WRONG — repeating pixel width on children
<div className="w-[327px] ...">
  <div className="w-[327px] ...">       {/* redundant! */}
    <Input className="w-[327px] ..." /> {/* breaks in flex rows! */}
  </div>
</div>
```

### Components = Inner Width is `w-full`

Components accept `className` for their outer wrapper. The inner content MUST use `w-full` to fill whatever width the parent gives:

```tsx
// CORRECT — component is width-agnostic
export function Input({ className, ... }) {
  return (
    <div className={className}>
      <div className="flex w-full flex-col ...">  {/* fills parent */}
        <div className="h-[40px] w-full rounded-full border ...">

// WRONG — hardcoded Figma artboard width inside component
export function Input({ className, ... }) {
  return (
    <div className={className}>
      <div className="flex w-[327px] flex-col ...">  {/* BREAKS in flex-1 row! */}
```

### App.tsx = Center the Mobile Frame

```tsx
// CORRECT — centers the fixed-size page in the viewport
export default function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e5e5e5]">
      <PageName />
    </div>
  );
}

// WRONG — page stretches to fill viewport
export default function App() {
  return <PageName />;
}
```

## CRITICAL: Semantic HTML for Interactive Elements

Figma designs are purely visual — they don't distinguish interactive from static elements. Generated code MUST use correct semantic HTML so the UI is functional.

### Rules

| Figma Element | Correct HTML | Wrong HTML |
|---|---|---|
| Input field (text entry) | `<input type="text" placeholder="..." className="..." />` | `<div><p>Placeholder</p></div>` |
| Password field | `<input type="password" placeholder="..." />` | `<div><p>Password</p></div>` |
| Email field | `<input type="email" placeholder="..." />` | `<div><p>Email</p></div>` |
| Button (action trigger) | `<button className="...">Label</button>` | `<div><p>Label</p></div>` |
| Link text (navigation) | `<a href="#" className="...">Text</a>` | `<div><p>Text</p></div>` |

### Input Type Detection

Detect the correct `type` attribute from placeholder/label text:
- "Email" → `type="email"`
- "Password" / "Confirm password" → `type="password"`
- "Phone number" → `type="tel"`
- Everything else → `type="text"`

### Interactive Element Required Attributes

Tailwind CSS v4 preflight removes browser default outlines and cursor styles. Without explicitly adding these back, interactive elements look and feel non-interactive. ALL interactive elements MUST include the attributes below.

| Element | Required Attributes |
|---|---|
| `<button>` | `type="button"`, `cursor-pointer`, `focus:outline-none focus:ring-2 focus:ring-primary` |
| `<input>` | correct `type` attribute, `cursor-pointer`, `focus:outline-none focus:ring-0` |
| `<a>` | `cursor-pointer`, `focus:outline-none focus:ring-2 focus:ring-primary` |

**CORRECT — button with all required attributes:**
```tsx
<button
  type="button"
  className="flex w-full cursor-pointer items-center justify-center rounded-full bg-primary px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
>
  <span className="font-sans text-base font-medium text-white">Sign up</span>
</button>
```

**WRONG — button missing cursor-pointer and focus styles (looks/feels non-interactive):**
```tsx
<button className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-2">
  <span className="font-sans text-base font-medium text-white">Sign up</span>
</button>
```

**CORRECT — input with all required attributes:**
```tsx
<input
  type="email"
  placeholder="Email"
  className="w-full cursor-pointer bg-transparent font-sans text-sm text-black placeholder:text-neutral-500 focus:outline-none focus:ring-0"
/>
```

**WRONG — input missing type, cursor, and focus styles:**
```tsx
<input
  placeholder="Email"
  className="w-full bg-transparent font-sans text-sm text-black placeholder:text-neutral-500"
/>
```

**CORRECT — link with all required attributes:**
```tsx
<a href="#" className="cursor-pointer font-sans text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary">
  Login
</a>
```

**WRONG — link missing cursor and focus styles:**
```tsx
<a href="#" className="font-sans text-xs font-bold text-primary">
  Login
</a>
```

## CRITICAL: Download All Figma Assets Locally

Figma MCP asset URLs (`figma.com/api/mcp/asset/*`) expire after 7 days. NEVER leave them in generated code.

### Process

1. Create `public/assets/` directory
2. Download each asset: `curl -sL -o public/assets/{filename} "{figma-url}"`
3. Name descriptively: `icon-arrow.svg`, `logo.svg`, etc.
4. Replace all Figma URLs in code with local paths: `/assets/{filename}`

### CRITICAL: Complex SVG Assets → Combine Into 1 File

Figma MCP decomposes complex vector graphics (logos, illustrations) into many individual SVG parts (separate mask + gradient-fill files per path group). A single logo can produce **10+ SVG files**.

**Detection**: 3+ asset URLs for one visual element, `mask-image` CSS patterns, nested `Clip path group` layers.

**Solution**: Do NOT download parts individually. Instead:
1. Download all parts, read their SVG contents
2. Discard mask SVGs (identical shapes to gradient SVGs, just `fill="black"`)
3. Combine all gradient-fill paths into **1 single SVG file** using nested `<svg>` elements for positioning
4. Calculate positions from CSS margin percentages: `ml-[X%]` → `x = X% × cell-width`
5. Apply vertical flip: `transform="translate(0, viewBox-height) scale(1, -1)"`
6. Save as `public/assets/{name}.svg`, delete individual parts
7. Component becomes a simple `<img src="/assets/{name}.svg" />` wrapper

See `gen-component/SKILL.md` → "Complex SVG Components → Single Asset File" for full procedure.

## CRITICAL: Instance Dimensions vs Template Dimensions

When a component instance has different text content than the template (e.g., "Resend OTP" component reused as "Login"), the template's fixed width does NOT apply:

```tsx
// CORRECT — fits actual text content
<div className="font-sans text-xs font-bold text-primary">
  <p className="leading-sm">Login</p>
</div>

// WRONG — uses template width for "Resend OTP" (82px)
<div className="w-[82px] font-sans text-xs font-bold text-primary">
  <p className="leading-sm">Login</p>
</div>
```
