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

### Step 1: Extract Design Tokens

Run `/design-tokens` with the provided Figma URL.

**Verify:** `src/index.css` contains a populated `@theme { }` block with actual token values (not just placeholder comments).

### Step 2: Map Components

Run `/component-map` with the provided Figma URL.

**Verify:** `.figma/component-map.json` exists and contains at least one component.

### Step 3: Generate Components

Read `.figma/component-map.json` and iterate through the `generationOrder` array.

For each component in order:
1. Run `/gen-component` with the component's Figma URL
2. Verify the generated file exists and compiles (`npx tsc --noEmit`)
3. If compilation fails, fix the error before moving to the next component

**Verify:** All components in the generation order have been created.

### Step 4: Generate Pages

Call `figma:get_metadata` on the Figma file to identify all page-level frames.

For each page frame:
1. Run `/gen-page` with the page frame's Figma URL
2. Verify the generated file exists and compiles

**Verify:** All page frames have corresponding files in `src/pages/`.

### Step 5: Verify Design Fidelity

Run `/verify-design` with the original Figma URL.

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
