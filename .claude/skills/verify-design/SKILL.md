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
