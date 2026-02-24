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
4. **MANDATORY — Fix `preserveAspectRatio` on ALL SVGs immediately after download:**
   ```bash
   for f in public/assets/*.svg; do
     sed -i '' 's/preserveAspectRatio="none"/preserveAspectRatio="xMidYMid meet"/g' "$f"
   done
   ```
   Figma MCP exports all SVGs with `preserveAspectRatio="none"` which stretches non-square icons to fill their container, causing visible distortion. Changing to `"xMidYMid meet"` scales uniformly and centers within the container.
5. Replace all Figma URLs in code with local paths: `/assets/{filename}`

### CRITICAL: Complex SVG Assets → Combine Into 1 File

Figma MCP decomposes complex vector graphics (logos, illustrations) into many individual SVG parts (separate mask + gradient-fill files per path group). A single logo can produce **10+ SVG files**.

**Detection**: 3+ asset URLs for one visual element, `mask-image` CSS patterns, nested `Clip path group` layers.

**Solution**: Do NOT download parts individually. Instead:
1. Download all parts, read their SVG contents
2. Discard mask SVGs (identical shapes to gradient SVGs, just `fill="black"`)
3. Combine all gradient-fill paths into **1 single SVG file** using nested `<svg>` elements for positioning
4. Calculate positions from CSS margin percentages: `ml-[X%]` → `x = X% × cell-width`
5. Apply vertical flip: `transform="translate(0, viewBox-height) scale(1, -1)"`
6. Save as `public/assets/{name}.svg`
7. **MANDATORY: `rm public/assets/{name}-mask-*.svg public/assets/{name}-fill-*.svg`** — delete ALL individual part files immediately, then verify with `ls` that only the combined file remains
8. Component becomes a simple `<img src="/assets/{name}.svg" />` wrapper

See `gen-component/SKILL.md` → "Complex SVG Components → Single Asset File" for full procedure.

## CRITICAL: Icon Variant Swap Asset Bug (Figma MCP Limitation)

Figma MCP `get_design_context` correctly **renders screenshots** with the right icon variants, but **exports asset URLs** that resolve to the **component master's default variant** icon instead of the overridden variant. This happens when:

- A component uses a generic wrapper (e.g., `Notification`) containing an `Icon` component
- The `Icon` component has a variant property (e.g., `typeIcon`) that swaps the visual
- The MCP resolves the inner vector node ID back to the **default variant** regardless of the override

**Detection**: After downloading icon assets, verify they are distinct:
```bash
md5 -q public/assets/icon-*.svg   # all hashes should be different
head -2 public/assets/icon-*.svg  # path data should differ
```

If multiple icons have identical content despite different Figma asset URLs, they are affected by this bug.

**Workaround — Query Variant Master Nodes Directly**:

1. **Identify the Icon component set** — use `get_metadata` to find the `<frame>` containing all `<symbol>` icon variants
2. **Find the variant master node** — match the variant name (e.g., `Type icon=Search` → its node ID)
3. **Call `get_design_context` on the variant master node** — the asset URL from this response will return the correct SVG
4. **Download and replace** the broken asset files

Example:
```
# Instance node returns bell icon (WRONG):
get_design_context(nodeId="{instance-node-id}")  → imgIcon downloads as default-variant.svg

# Variant master node returns correct icon (CORRECT):
get_design_context(nodeId="{variant-master-node-id}")  → imgIcon downloads as correct-icon.svg
```

This workaround is required for **any** component that uses variant property swaps to change nested vector/icon content.

### Silent Single-File Variant Swap (md5 Blind Spot)

The md5 duplicate detection (`md5 -q public/assets/icon-*.svg | sort | uniq -d`) has a blind spot: it only catches duplicates when 2+ files exist with identical content. It **misses** the case where MCP returns the **same asset URL** for different Icon variant overrides, causing the pipeline to download only **1 file** instead of N.

**Example scenario:**
- `CardDevice` is used twice on a page: once with `typeIcon=Door`, once with `typeIcon=fridge`
- MCP `get_design_context` returns the same asset URL for both instances (the default variant's URL)
- The pipeline downloads 1 file (`icon-door.svg`) and uses it for both cards
- Since there's no second file, `md5 | uniq -d` has nothing to compare → passes silently
- Result: both cards show the door icon instead of door + fridge

**Detection — Proactive (before download):**
1. Parse Icon variant names from `get_design_context` output or `iconVariants` in component-map.json
2. Count unique Icon variant values expected vs files actually downloaded
3. If expected > downloaded → silent swap occurred

**Detection — Reactive (after page generation):**
1. Check if the same component is used 2+ times on the page with different icon prop values expected
2. If 2+ instances point to the same file but the Figma screenshot shows different icons → silent swap

**Fix:** Always download Icon assets from **variant master nodes**, not from instance context:
1. Find the Icon component set via `get_metadata`
2. For each unique variant value, get the variant master node ID
3. Call `get_design_context` on each master node — the asset URL from this response resolves correctly
4. Download and name each file based on the variant value: `icon-{variant-value}.svg`

This approach makes the md5 check a **safety net** rather than the primary detection mechanism. The proactive detection in `/component-map` (`iconVariants` field) and `/gen-component` (variant master node download) prevents the bug before it occurs.

## CRITICAL: Component Variant State Management

Some Figma components have multiple state variants (e.g., a navigation bar with `State=Tab1`, `State=Tab2`, `State=Tab3`). Each variant may have different backgrounds, icon positions, text colors, or other visual differences. These are NOT simple styling variants (like `Primary`/`Secondary` buttons) — they represent **runtime states** that the user switches between.

### MANDATORY: Find Component Set Parent BEFORE Generating Any Component

**This step applies to EVERY component, not just multi-state ones.** A page instance only shows one variant. The component set parent reveals ALL variants and is the source of truth for the component's full behavior.

**How to find the component set parent:**

1. Call `figma:get_metadata` on the root page (`0:1`) to get the full file structure
2. Search for a `<frame>` whose `name` matches the component instance name
3. The correct frame is the one containing `<symbol>` children — these are variant master nodes
4. Record the frame ID as `componentSetId` and each `<symbol>` ID as a variant master node

**Example:**
```
Page instance: <instance id="371:1604" name="Tab bar" />

File metadata search → find:
  <frame id="355:2583" name="Tab bar">           ← COMPONENT SET
    <symbol id="355:2579" name="State=Home" />    ← variant master
    <symbol id="355:2580" name="State=Device" />  ← variant master
    <symbol id="355:2581" name="State=Profile" /> ← variant master
    <symbol id="355:2582" name="State=Setting" /> ← variant master
  </frame>
```

**CRITICAL VERIFICATION:** After writing `multiStateVariants` to component-map.json, verify the node IDs are REAL variant master nodes (`<symbol>` IDs from the component set), NOT the page instance ID repeated. If all node IDs are identical, the component set was NOT found — go back and find it.

### How to Detect Multi-State Component Sets

After finding the component set parent:

1. You already have all `<symbol>` children of the component set from the step above
2. Parse variant names for a shared property axis: `State=Tab1`, `State=Tab2` → property: `State`
3. If 2+ variants share a property axis AND the variants have **visual differences beyond just colors** (different assets, element positions, visibility), it's a multi-state component
4. Record `multiStateVariants` in the component map JSON with the property name and all variant node IDs

### Common Multi-State Patterns

| Pattern | Example | Property Axis | What Changes Between Variants |
|---|---|---|---|
| Tab bar / Navigation | `State=Tab1/Tab2/Tab3` | `State` | Background SVG, active indicator position, icon highlight |
| Toggle / Switch | `State=On/Off` | `State` | Track color, thumb position |
| Accordion | `State=Expanded/Collapsed` | `State` | Content visibility, chevron rotation |
| Segmented control | `Selected=Option1/Option2/Option3` | `Selected` | Active segment background, text weight |
| Stepper / Progress | `Step=1/2/3/4` | `Step` | Active step indicator, completed step styles |

### Pattern for Downloading Variant-Specific Assets

When variants have different assets (e.g., a different background SVG per variant):

```bash
# Download one asset per variant: {component-name}-{variant-value}.svg
curl -sL -o public/assets/{component}-{value1}.svg "{asset-url-from-variant-1}"
curl -sL -o public/assets/{component}-{value2}.svg "{asset-url-from-variant-2}"
curl -sL -o public/assets/{component}-{value3}.svg "{asset-url-from-variant-3}"

# MANDATORY: Fix preserveAspectRatio on all SVGs
for f in public/assets/*.svg; do
  sed -i '' 's/preserveAspectRatio="none"/preserveAspectRatio="xMidYMid meet"/g' "$f"
done
```

### Pattern for Generating Stateful Components

```tsx
// 1. Define type union from multiStateVariants.values[].name
type VariantKey = "Value1" | "Value2" | "Value3";

// 2. Asset map for variant-specific resources (only if variants have different assets)
const bgMap: Record<VariantKey, string> = {
  Value1: "/assets/{component}-value1.svg",
  Value2: "/assets/{component}-value2.svg",
  Value3: "/assets/{component}-value3.svg",
};

// 3. Props: variant value + callback
interface ComponentProps {
  activeState: VariantKey;
  onStateChange: (state: VariantKey) => void;
  className?: string;
}

// 4. Component switches rendering based on variant prop
export function Component({ activeState, onStateChange, className }: ComponentProps) {
  return (
    <div className={className ?? "..."}>
      <img src={bgMap[activeState]} alt="" className="..." />
      {(["Value1", "Value2", "Value3"] as const).map((value) => (
        <button
          key={value}
          type="button"
          className={`cursor-pointer ${activeState === value ? "text-primary" : "text-neutral-500"}`}
          onClick={() => onStateChange(value)}
        >
          {/* variant-specific content */}
        </button>
      ))}
    </div>
  );
}
```

### Pattern for Wiring State in Pages

```tsx
import { useState } from "react";
import { Component, type VariantKey } from "@/components/patterns/Component";

export function PageName() {
  // Initialize with the variant shown on the Figma page instance
  const [activeState, setActiveState] = useState<VariantKey>("{initial-value}");

  return (
    <div className="relative h-[{H}px] w-[{W}px] ...">
      {/* ... page content ... */}
      <Component activeState={activeState} onStateChange={setActiveState} className="..." />
    </div>
  );
}
```

### Why This Matters

Without multi-state variant handling:
1. Only ONE variant's assets are downloaded (the page instance's variant)
2. The component is generated as static (no state switching)
3. Users see the correct initial state but can't interact (tabs don't switch, toggles don't toggle)
4. Requires multiple rounds of manual debugging to fix

With proper handling:
1. ALL variant assets are downloaded during `/gen-component`
2. The component accepts a variant prop and switches assets/styles
3. The page wires `useState` + callback on first generation
4. Works correctly on first run

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
