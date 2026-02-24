---
name: figma-to-code
description: Full pipeline — extract tokens, map components, generate all code, and verify fidelity
argument-hint: <figma-url>
disable-model-invocation: true
allowed-tools: figma:get_metadata, figma:get_design_context, figma:get_screenshot, figma:get_variable_defs, Read, Write, Edit, Bash, Skill
---

# /figma-to-code

Full pipeline orchestrator that converts an entire Figma file into production React code.

## Pipeline Steps

Execute these steps in order. Each step must complete successfully before proceeding to the next.

### Step 0: Load Generation Rules (MANDATORY PRE-FLIGHT)

Before generating ANY code, READ these files into context:

1. `.claude/skills/figma-to-code/references/pipeline-steps.md` — Width/dimension rules, semantic HTML rules, token resolution, interactive element attributes
2. `.claude/skills/gen-component/SKILL.md` — Component generation procedure + all CRITICAL sections
3. `.claude/skills/gen-page/SKILL.md` — Page generation procedure + frame dimensions, container positioning, w-full rules
4. `.claude/skills/verify-design/SKILL.md` — Full verification checklist

**These files contain CRITICAL rules for correct code generation. Skipping this step guarantees broken output** — buttons without `cursor-pointer`, inputs without correct `type`, pages using `size-full` instead of exact dimensions, hardcoded widths instead of `w-full`, and expired Figma asset URLs left in code.

Do NOT proceed to Step 1 until all four files have been read.

### Step 1: Extract Design Tokens

Run `/design-tokens` with the provided Figma URL.

**Verify:** `src/index.css` contains a populated `@theme { }` block with actual token values (not just placeholder comments).

### Step 2: Map Components

Run `/component-map` with the provided Figma URL.

**Verify:** `.figma/component-map.json` exists and contains at least one component.

### Step 3: Generate Components

Read `.figma/component-map.json` and iterate through the `generationOrder` array.

For each component in order, follow the **COMPLETE procedure** in `.claude/skills/gen-component/SKILL.md` (do NOT just call `/gen-component` — the sub-skill rules must be applied):
1. Execute all steps from gen-component SKILL.md (fetch context, screenshot, tokens, download assets, generate, verify)
2. Verify the generated file exists and compiles (`npx tsc --noEmit`)
3. If compilation fails, fix the error before moving to the next component

**Post-generation checklist for EACH component** (fix before moving on):
- [ ] `<button>` elements have `type="button"`, `cursor-pointer`, `focus:outline-none focus:ring-2 focus:ring-primary`
- [ ] `<input>` elements have correct `type` attribute (email/password/tel/text) and `cursor-pointer`, `focus:outline-none focus:ring-0`
- [ ] `<a>` elements have `cursor-pointer`, `focus:outline-none focus:ring-2 focus:ring-primary`
- [ ] Inner wrappers use `w-full`, not hardcoded pixel widths (e.g., `w-[327px]`)
- [ ] No Figma MCP URLs (`figma.com/api/mcp/asset/*`) remain in code — all assets downloaded to `public/assets/`
- [ ] **SVG `preserveAspectRatio` fix**: After downloading SVGs, run `sed` to replace `preserveAspectRatio="none"` with `"xMidYMid meet"` on ALL SVG files (prevents icon distortion)
- [ ] Instance text containers don't use the template's fixed width — use `w-fit` or omit width
- [ ] Complex SVG assets (logos, illustrations with 3+ asset URLs) are combined into a single SVG file, not downloaded as individual parts (see gen-component SKILL.md → "Complex SVG Components")
- [ ] After combining complex SVGs, ALL individual part files (`*-mask-*.svg`, `*-fill-*.svg`) have been deleted from `public/assets/` — run `ls public/assets/` to confirm only combined files remain
- [ ] **Icon Variant Swap Bug check**: After downloading 2+ icon SVGs, run `md5 -q public/assets/icon-*.svg | sort | uniq -d` — if ANY output, icons are duplicated due to the MCP variant swap bug. Fix by fetching assets from **variant master nodes** instead of instances (see gen-component SKILL.md → "Verify Icon Assets After Download")
- [ ] **Silent Icon Variant Swap check**: Components containing Icon subcomponents with variant overrides (typeIcon, etc.) have EACH distinct variant downloaded as a separate file from its variant master node — even if MCP returned the same asset URL for all variants. Check: each instance's icon prop points to a different file.
- [ ] **Multi-state variant assets**: Components with `multiStateVariants` in the component map have ALL variant-specific assets downloaded (one per variant, named `{component}-{variant-value}.svg`)
- [ ] **Multi-state variant prop + callback**: Components with `multiStateVariants` define a variant prop and a callback prop (e.g., `activeState: VariantKey`, `onStateChange: (state: VariantKey) => void`) in their interface
- [ ] **Multi-state asset map**: Components with variant-specific assets use a `Record<VariantKey, string>` to switch assets based on the variant prop

**Verify:** All components in the generation order have been created and pass the checklist.

### Step 4: Generate Pages

Call `figma:get_metadata` on the Figma file to identify all page-level frames.

For each page frame, follow the **COMPLETE procedure** in `.claude/skills/gen-page/SKILL.md` (do NOT just call `/gen-page` — the sub-skill rules must be applied):
1. Execute all steps from gen-page SKILL.md (fetch metadata, screenshot, read components, fetch design context per section, generate page, update App.tsx, semantic check, asset check, visual verify)
2. Verify the generated file exists and compiles

**Post-generation checklist for EACH page** (fix before moving on):
- [ ] Page root uses exact Figma frame pixel dimensions (e.g., `w-[375px] h-[812px]`), NOT `size-full`, `w-full`, or `min-h-screen`
- [ ] Main container uses exact pixel positioning (`left-[Xpx] top-[Ypx]`) and exact dimensions (`w-[Wpx] h-[Hpx]`), NOT `left-1/2 -translate-x-1/2`
- [ ] All children of the container use `w-full`, not the parent's pixel width repeated
- [ ] Full-width components (buttons, inputs spanning the container) have `w-full` in their className prop
- [ ] App.tsx wraps the page in a centered viewport container (`flex min-h-screen items-center justify-center bg-[#e5e5e5]`)
- [ ] All interactive elements use semantic HTML (inputs as `<input>`, buttons as `<button>`, links as `<a>`)
- [ ] No Figma MCP URLs remain in code — all assets downloaded to `public/assets/`
- [ ] Instance text containers don't use the template's fixed width
- [ ] **Icon Variant Swap Bug check**: Run `md5 -q public/assets/icon-*.svg | sort | uniq -d` — no output means all icons are unique. If duplicates found, fix via variant master nodes before proceeding
- [ ] **Cross-instance icon verification**: When the same component is used 2+ times with different expected icons (e.g., CardDevice for "door" and "fridge"), verify each instance's icon prop references a distinct asset file. If both point to the same file, the variant swap bug was missed.
- [ ] **Stateful component wiring**: Pages using multi-state components (those with `multiStateVariants` in component map) import `useState` from React
- [ ] **State initialization**: State is initialized with the Figma page instance's variant value (e.g., `useState<VariantKey>("{value}")` matching the variant shown on the page)
- [ ] **State + callback props**: State variable and setter callback are passed as props to the multi-state component (e.g., `<Component activeState={state} onStateChange={setState} />`)

**Verify:** All page frames have corresponding files in `src/pages/` and pass the checklist.

### Step 5: Verify Design Fidelity

Follow the **COMPLETE checklist** in `.claude/skills/verify-design/SKILL.md` (do NOT just call `/verify-design` — every checklist item must be explicitly checked):

1. Fetch Figma screenshot and design context
2. Read all generated code files
3. Explicitly verify every item under these CRITICAL sections:
   - **Semantic HTML (CRITICAL)**: inputs use `<input>`, buttons use `<button>`, correct `type` attributes, focus styles present, `cursor-pointer` on all interactive elements
   - **Frame & Width Fidelity (CRITICAL)**: page root has exact pixel dimensions, container has exact pixel positioning, children use `w-full`, components have `w-full` in className, App.tsx centers the page
   - **Local Assets (CRITICAL)**: no Figma MCP URLs remain, all assets downloaded locally
   - **Icon Asset Uniqueness (CRITICAL)**: run `md5 -q public/assets/icon-*.svg | sort | uniq -d` — any output means the MCP variant swap bug was not caught. Fix immediately via variant master nodes
   - **Instance Dimensions**: reused instances don't carry template's fixed width
4. Also verify: Colors, Typography, Spacing, Border/Radius, Shadows, Layout, Structure, States

Review the verification report:
- If **PASS**: Proceed to Step 6
- If **FAIL**: Address each reported issue, then re-run verification

### Step 6: Final Build

Run `npm run build` to verify the complete project compiles.

**Verify:** Build completes with zero errors.

### Step 7: Summary Report

Output a final summary:

```
## Figma-to-Code Pipeline Complete

**Source:** {Figma URL}
**Tokens:** {count} tokens extracted
**Components:** {count} components generated
  - ui: {count}
  - patterns: {count}
**Pages:** {count} pages generated
**Verification:** PASS/FAIL
**Build:** SUCCESS/FAILED

### Generated Files
- src/index.css (tokens)
- src/tokens/index.ts
- src/components/ui/{list}
- src/components/patterns/{list}
- src/pages/{list}

### Next Steps
- Run `npm run dev` to preview
- Run `/verify-design <url>` to re-check after manual edits
```

## Error Handling

- If any step fails, report the error clearly and stop. Don't continue with a broken state.
- If a component fails to generate, skip it but note it in the final report as a manual TODO.
- If design verification fails, list all issues but still complete the build step.

## Rules

- **Sequential execution**: Steps must run in order. Tokens before components, components before pages.
- **Incremental verification**: Check after each step, not just at the end.
- **No shortcuts**: Don't skip the component map step even if there are few components. The map ensures correct generation order.
- **Preserve existing code**: If components or pages already exist from a previous run, regenerate them (overwrite) to ensure they match the latest Figma state.
