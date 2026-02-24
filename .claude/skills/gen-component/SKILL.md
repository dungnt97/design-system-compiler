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
3. Name files descriptively: `icon-arrow.svg`, `icon-eye-open.svg`, `logo.svg`, etc.
4. Replace all Figma MCP URLs in the component code with local paths: `/assets/{filename}`

This is CRITICAL because Figma MCP asset URLs expire after 7 days. Local assets ensure the app works permanently.

Example:
```bash
# Download
curl -sL -o public/assets/icon-eye-open.svg "https://www.figma.com/api/mcp/asset/abc123"

# In code: use local path
const imgIconEyeOpen = "/assets/icon-eye-open.svg";
```

#### MANDATORY: Fix SVG `preserveAspectRatio` After Download

Figma MCP exports ALL SVGs with `preserveAspectRatio="none"`, which causes icons to **stretch/distort** when the SVG viewBox aspect ratio doesn't match the container's aspect ratio (e.g., a 20×19 SVG in a 24×24 container).

**After downloading ANY SVG assets, immediately run:**

```bash
for f in public/assets/*.svg; do
  sed -i '' 's/preserveAspectRatio="none"/preserveAspectRatio="xMidYMid meet"/g' "$f"
done
```

This changes the behavior from "stretch to fill, ignore ratio" to "scale uniformly, center within container". **Do NOT skip this step** — non-square icons (which are the majority) will be visibly distorted without it.

#### CRITICAL: Complex SVG Components → Single Asset File

Figma MCP decomposes complex vector graphics (logos, illustrations, decorative icons) into many individual SVG parts — separate mask and gradient-fill files for each path group. This can produce **10+ SVG files for a single logo**. Do NOT download them individually.

**Detection**: A component is a "complex SVG asset" if the `get_design_context` output has:
- 3+ asset URLs (`figma.com/api/mcp/asset/*`) for a single visual element
- CSS `mask-image` / `mask-alpha` patterns in the generated code
- Deep nesting of `Clip path group` layers in the hierarchy
- The component is visually a single image (logo, illustration, badge)

**Correct approach — combine into 1 SVG**:

1. Download ALL the individual SVG parts (both mask and gradient-fill variants)
2. Read their contents — each pair has identical path shapes: the mask uses `fill="black"`, the image uses `fill="url(#gradient)"`
3. Only the gradient-fill SVGs are needed (the masks are redundant since shapes are identical)
4. Create a single combined SVG file that positions all gradient paths using nested `<svg>` elements:

```svg
<svg width="W" height="H" viewBox="0 0 W H" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Each part as a nested SVG with its position, size, viewBox, and flip transform -->
  <svg x="{x}" y="{y}" width="{w}" height="{h}" viewBox="{original-viewBox}" overflow="visible">
    <g transform="translate(0, {viewBox-height}) scale(1, -1)">
      <path d="..." fill="url(#grad-id)"/>
    </g>
    <defs>
      <linearGradient id="grad-id" ...>...</linearGradient>
    </defs>
  </svg>
  <!-- ... more parts ... -->
</svg>
```

5. Calculate positions from the CSS grid/margin percentages in the `get_design_context` output:
   - `ml-[X%]` → `x = X% × grid-cell-width` (grid cell width = widest element's width)
   - `mt-[Y%]` → `y = Y% × grid-cell-width` (CSS % margins resolve relative to inline-size/width)
   - `-scale-y-100` → `transform="translate(0, viewBox-height) scale(1, -1)"` (vertical flip)
6. Save as a single file: `public/assets/{component-name}.svg`
7. **MANDATORY CLEANUP — Delete ALL individual part files immediately:**
   ```bash
   rm public/assets/{component-name}-mask-*.svg public/assets/{component-name}-fill-*.svg
   ```
   Verify with `ls public/assets/` that ONLY the combined file remains. Do NOT proceed to component generation until individual parts are deleted.

**The component then becomes a simple `<img>` wrapper:**

```tsx
interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={className ?? "relative size-[140px]"}>
      <img src="/assets/logo.svg" alt="Logo" className="size-full" />
      <p className="w-full text-center font-sans text-[9.69px] font-semibold uppercase leading-[14.194px] text-primary">
        Brand Name
      </p>
    </div>
  );
}
```

**Result**: 1 SVG file + simple component instead of 12+ SVG files + complex CSS mask code.

#### CRITICAL: Proactive Icon Variant Detection (Silent Swap Prevention)

Before relying on the md5 duplicate check below, proactively detect and download Icon variant assets from their **variant master nodes**. This prevents the **silent single-file variant swap bug** where MCP returns the same asset URL for different Icon variant overrides, resulting in only 1 file downloaded — making the md5 check blind (nothing to compare).

**When to apply:** When `get_design_context` output for this component contains an `Icon` sub-component with a variant property (`typeIcon`, `type`, `icon`, etc.), OR when `.figma/component-map.json` has an `iconVariants` field for this component.

**Procedure:**

1. **Parse ALL unique Icon variant values** used across instances of this component on the page. Sources:
   - `iconVariants` array in `.figma/component-map.json` (preferred — already resolved by `/component-map`)
   - `get_design_context` output showing Icon instances with variant property overrides
2. **For EACH unique variant value**, find the variant master node:
   - Use `get_metadata` on the Icon component set to list all `<symbol>` children
   - Match each variant by name (e.g., `Type icon=Door` → node ID `48:28266`)
3. **Download each icon from its variant master node** using `get_design_context` on the master node (never trust instance asset URLs for Icon variant swaps):
   ```bash
   # For each unique variant:
   curl -sL -o public/assets/icon-{variant-value}.svg "{asset-url-from-master-node}"
   ```
4. **Run the mandatory SVG `preserveAspectRatio` fix** on all downloaded icons
5. **Verify** all expected icon files exist and have distinct content:
   ```bash
   ls -la public/assets/icon-*.svg  # confirm all expected files exist
   md5 -q public/assets/icon-*.svg | sort | uniq -d  # confirm no duplicates
   ```

This step runs **before** the md5 check below, making the md5 check a safety net rather than the primary detection mechanism.

#### CRITICAL: Verify Icon Assets After Download (Icon Variant Swap Bug)

Figma MCP has a known bug: when a component uses an `Icon` component with a `typeIcon` variant property swap (e.g., bell → home), `get_design_context` exports the **default variant's SVG** (bell) instead of the overridden variant (home). Different asset UUIDs are returned but they all download to the **same SVG file**.

**MANDATORY — After downloading 2+ icon SVGs, run this check:**

```bash
# Check if any icon files are identical
md5 -q public/assets/icon-*.svg | sort | uniq -d
```

If the command produces ANY output, duplicate icons exist. Fix them:

1. **Identify the affected icons** — compare the screenshot (correct) vs downloaded SVG (wrong)
2. **Find the Icon component set** — use `get_metadata` on the page to find the `<frame>` or `<symbol>` containing all icon variants (look for names like `Type icon=Search`, `Type icon=Settings`, etc.)
3. **Get the variant master node IDs** — each variant is a direct child of the component set frame
4. **Call `get_design_context` on each variant master node** — NOT the instance. The variant master's asset URL returns the correct SVG
5. **Download and overwrite** the broken icon files
6. **Re-verify** with `md5` — all hashes must now be unique

Example:
```bash
# Instance node → returns default variant icon (WRONG)
# get_design_context(nodeId="{instance-node}") → default-icon.svg

# Variant master node → returns correct icon (CORRECT)
# get_design_context(nodeId="{variant-master-node}") → correct-icon.svg ✓

# Download correct asset
curl -sL -o public/assets/icon-{name}.svg "{correct-asset-url}"

# Verify all icons are unique
md5 -q public/assets/icon-*.svg | sort | uniq -d
# (should produce no output)
```

**Do NOT proceed to Step 6 until all icon assets are verified unique.**

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

### CRITICAL: Multi-State Component Variants

When the component map (`.figma/component-map.json`) has a `multiStateVariants` field for this component, it means the component has multiple Figma variants that represent **runtime states** (e.g., tabs, toggles, accordions, segmented controls). Each variant may have different assets, element positions, or styles. You MUST generate a stateful component that handles all variants.

#### Step 6a: Fetch ALL Variant Design Contexts

Call `figma:get_design_context` + `figma:get_screenshot` on **each variant master node** listed in `multiStateVariants.values[]` — NOT just the page instance.

```
// Fetch each variant master node from multiStateVariants.values[]
for each { name, nodeId } in multiStateVariants.values:
  get_design_context(nodeId="{nodeId}")   // e.g., State={name}
  get_screenshot(nodeId="{nodeId}")
```

#### Step 6b: Diff Variants — Identify What Changes

Compare all variant design contexts and screenshots to identify differences:

| Change type | Example | Implementation |
|---|---|---|
| Different asset URLs | Background SVG changes per tab | Download a separate asset per variant |
| Different element position | Active indicator moves | Conditional positioning classes |
| Different element visibility | Icon highlighted/dimmed | Conditional opacity/color classes |
| Different text colors/styles | Active tab label is bold | Conditional text classes |

#### Step 6c: Download Variant-Specific Assets

When variants have different assets (e.g., different background SVGs), download one per variant with a naming convention:

```bash
# Naming convention: {component-name}-{variant-value}.svg
curl -sL -o public/assets/{component}-{value1}.svg "{url-from-variant-1}"
curl -sL -o public/assets/{component}-{value2}.svg "{url-from-variant-2}"
curl -sL -o public/assets/{component}-{value3}.svg "{url-from-variant-3}"
```

Then run the mandatory SVG `preserveAspectRatio` fix on all downloaded assets.

#### Step 6d: Generate with Variant Prop + Callback

Create:
1. A **type union** from variant values (e.g., `type VariantKey = "Value1" | "Value2" | "Value3"`)
2. A **variant prop** matching the property name (e.g., `activeState: VariantKey`)
3. A **callback prop** for state changes (e.g., `onStateChange: (state: VariantKey) => void`)
4. An **asset map** (`Record<VariantKey, string>`) for variant-specific assets

```tsx
// Type union derived from multiStateVariants.values[].name
type VariantKey = "Value1" | "Value2" | "Value3";

// Asset map — one entry per variant (only if variants have different assets)
const bgMap: Record<VariantKey, string> = {
  Value1: "/assets/{component}-value1.svg",
  Value2: "/assets/{component}-value2.svg",
  Value3: "/assets/{component}-value3.svg",
};

interface ComponentProps {
  activeState: VariantKey;
  onStateChange: (state: VariantKey) => void;
  className?: string;
}

export function Component({ activeState, onStateChange, className }: ComponentProps) {
  return (
    <div className={className ?? "..."}>
      <img src={bgMap[activeState]} alt="" className="..." />
      {/* Elements with conditional styles based on activeState */}
    </div>
  );
}
```

#### Step 6e: Implement Conditional Rendering for Differences

For each difference found in Step 6b:
- **Different positions**: Use conditional absolute positioning or transforms
- **Different visibility/styles**: Use ternary expressions in className
- **Different content**: Use conditional rendering (`{activeTab === "Home" && ...}`)

```tsx
// Conditional active styling example
<button
  type="button"
  className={`cursor-pointer ${activeState === "Value1" ? "text-primary" : "text-neutral-500"}`}
  onClick={() => onStateChange("Value1")}
>
```

**IMPORTANT**: Do NOT generate a static component that only renders one variant. All variants must be switchable via the variant prop.

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
