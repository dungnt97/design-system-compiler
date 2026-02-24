---
name: verify-design
description: Compare generated code against Figma design for 100% fidelity verification
argument-hint: <figma-url>
disable-model-invocation: true
context: fork
allowed-tools: figma:get_design_context, figma:get_screenshot, Read, Glob, Grep
---

# /verify-design

Verify that generated code matches the Figma design with 100% fidelity. This skill runs in read-only mode — it does not modify any files.

## Procedure

### Step 1: Fetch Figma Screenshot

Call `figma:get_screenshot` with the provided Figma URL to get the visual reference.

### Step 2: Fetch Figma Design Context

Call `figma:get_design_context` with the Figma URL to get detailed style and layout specifications.

### Step 3: Read Generated Code

Read all relevant generated files:
- `src/index.css` (tokens)
- Components in `src/components/ui/` and `src/components/patterns/`
- Pages in `src/pages/`
- Token definitions in `src/tokens/index.ts`

### Step 4: Run Verification Checklist

For each component/page, verify against Figma:

#### Colors
- [ ] All background colors match exactly (hex values)
- [ ] All text colors match exactly
- [ ] All border colors match exactly
- [ ] All shadow colors match exactly
- [ ] Opacity values match

#### Typography
- [ ] Font families match
- [ ] Font sizes match (exact px values)
- [ ] Font weights match
- [ ] Line heights match
- [ ] Letter spacing matches
- [ ] Text alignment matches
- [ ] Text decoration matches (underline, strikethrough)

#### Spacing
- [ ] Padding values match (all sides)
- [ ] Gap values match (flex/grid gaps)
- [ ] Margin values match (if used)
- [ ] Section spacing matches

#### Border & Radius
- [ ] Border widths match
- [ ] Border styles match (solid, dashed, etc.)
- [ ] Border radius values match (all corners)

#### Shadows
- [ ] Box shadow values match (offset, blur, spread, color)
- [ ] All elevation levels present

#### Layout
- [ ] Flex direction matches (row/column)
- [ ] Alignment matches (items, justify, self)
- [ ] Dimensions match (width, height, min/max)
- [ ] Position type matches (relative, absolute, fixed)
- [ ] Absolute position offsets match (top, left, right, bottom)
- [ ] Grid configuration matches (columns, rows, gap)
- [ ] Overflow behavior matches

#### Frame & Width Fidelity (CRITICAL)
- [ ] Page root div uses exact Figma frame pixel dimensions (e.g., `w-[375px] h-[812px]`), NOT `size-full` or `w-full`
- [ ] Main container uses exact pixel positioning (`left-[Xpx] top-[Ypx]`) and dimensions (`w-[Wpx] h-[Hpx]`)
- [ ] Full-width children use `w-full`, not a hardcoded pixel width repeating the parent
- [ ] Full-width components (buttons, inputs spanning container) have `w-full` in their className
- [ ] Component inner wrappers use `w-full`, not hardcoded widths like `w-[327px]`
- [ ] App.tsx centers the page frame in the viewport (not stretching it)

#### Semantic HTML (CRITICAL)
- [ ] Input fields use `<input>` elements (not `<div><p>placeholder</p></div>`)
- [ ] Buttons use `<button>` elements (not `<div><p>label</p></div>`)
- [ ] Clickable text uses `<button>` or `<a>` elements (not `<div><p>text</p></div>`)
- [ ] Input type attributes are correct (`email`, `password`, `tel`, `text`)
- [ ] Placeholder text is in `placeholder` attribute, not in `<p>` tags
- [ ] Interactive elements have focus styles (`focus:ring-2` or similar)

#### Local Assets (CRITICAL)
- [ ] No Figma MCP URLs (`figma.com/api/mcp/asset/*`) remain in any component or page code
- [ ] All images/icons are downloaded to `public/assets/` and referenced as `/assets/{filename}`
- [ ] SVG assets are saved as `.svg` files, raster images as `.png` or appropriate format
- [ ] Complex SVG assets (logos, illustrations) are combined into a single SVG file — NOT stored as many individual mask/gradient part files

#### Icon Asset Uniqueness (CRITICAL)
- [ ] Run `md5 -q public/assets/icon-*.svg | sort | uniq -d` — command produces NO output (all icons are unique)
- [ ] If duplicates found: Figma MCP variant swap bug — assets were exported from the default variant instead of the overridden variant. Fix by calling `get_design_context` on the Icon component's **variant master nodes** (e.g., `Type icon=Home` node) instead of the instance nodes, then re-download
- [ ] Visually compare each icon in the browser against the Figma screenshot to confirm correctness
- [ ] When the same component appears 2+ times on the page with different icons visible in the Figma screenshot, verify each instance's icon prop in the code points to a DIFFERENT asset file. Same file = silent variant swap bug.

#### Instance Dimensions
- [ ] Reused component instances with different text content do NOT use the template's fixed width
- [ ] Text containers in reused instances use `w-fit` or no explicit width (not template's hardcoded width)

#### Token Namespaces (CRITICAL)
- [ ] `src/index.css` `@theme` block uses `--text-*` for font sizes (NOT `--font-size-*`)
- [ ] `src/index.css` `@theme` block uses `--leading-*` for line heights (NOT `--line-height-*`)
- [ ] `src/index.css` `@theme` block uses `--tracking-*` for letter spacing (NOT `--letter-spacing-*`)
- [ ] `src/index.css` `@theme` block uses `--radius-*` for border radius (NOT `--border-radius-*`)
- [ ] Every `--text-{name}` has a matching `--text-{name}--line-height` compound token
- [ ] Build CSS output confirms custom token values override Tailwind defaults (not falling back to default sizes)

#### Structure
- [ ] Layer hierarchy preserved
- [ ] All elements present (no missing layers)
- [ ] No extra elements added
- [ ] Component composition is correct

#### States & Variants
- [ ] All variants implemented
- [ ] Hover states match
- [ ] Active/pressed states match
- [ ] Disabled states match
- [ ] Focus states match

#### Multi-State Component Variants (CRITICAL)
- [ ] Components with `multiStateVariants` in `.figma/component-map.json` switch between ALL variants correctly via a prop (e.g., `activeTab`)
- [ ] Each variant has its own downloaded assets — no shared assets that only match one variant (e.g., if a component has 4 states, there should be 4 variant-specific asset files, not 1)
- [ ] Variant-specific asset map (`Record<VariantKey, string>`) exists and maps each variant to its correct asset
- [ ] Pages using multi-state components have `useState` + callback wiring (e.g., `const [state, setState] = useState<VariantKey>("{initial}")`)
- [ ] State is initialized with the Figma page instance's variant value (not hardcoded to the first variant unless that's what the page shows)
- [ ] Switching variants via the callback prop doesn't break the UI layout (all variant assets render at the correct size/position)
- [ ] Interactive elements within multi-state components (e.g., tab buttons) have `onClick` handlers that call the callback prop

### Step 5: Generate Report

Output a structured verification report:

```
## Verification Report

**Target:** {Figma URL}
**Generated files:** {list of files checked}
**Date:** {timestamp}

### Results

| Category      | Status | Issues |
|---------------|--------|--------|
| Colors        | PASS/FAIL | ... |
| Typography    | PASS/FAIL | ... |
| Spacing       | PASS/FAIL | ... |
| Border/Radius | PASS/FAIL | ... |
| Shadows       | PASS/FAIL | ... |
| Layout        | PASS/FAIL | ... |
| Structure     | PASS/FAIL | ... |
| States        | PASS/FAIL | ... |

### Overall: PASS / FAIL

### Issues Found (if any)
1. {description of mismatch, expected vs actual, file:line}
2. ...

### Recommendations (if FAIL)
1. {specific fix needed}
2. ...
```

## Rules

- **Read-only**: This skill MUST NOT modify any files. It only reads and reports.
- **Exact comparison**: Compare exact values, not approximate. `#F5F5F5` is not `#F4F4F4`.
- **Report everything**: Even minor discrepancies should be reported. The goal is 100% fidelity.
- **Specific locations**: Always reference specific files and line numbers when reporting issues.
- **Actionable recommendations**: Each issue should come with a clear, specific fix recommendation.
