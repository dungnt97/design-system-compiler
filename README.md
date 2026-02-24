# Design System Compiler

A Figma-to-code compiler powered by [Claude Code](https://claude.ai/claude-code) and the [Figma MCP server](https://github.com/anthropics/figma-mcp-server). It translates Figma designs into production-ready React components with **100% visual fidelity** — no creative liberty, no approximation, no manual tweaking.

## How It Works

```
Figma Design ──► Figma MCP Server ──► Claude Code Skills ──► React + TypeScript + Tailwind CSS
```

The compiler uses a pipeline of Claude Code slash-command skills that read your Figma file via the MCP protocol, extract design tokens, analyze component structure, and generate pixel-perfect code — all automated.

## Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- [Figma MCP server](https://github.com/anthropics/figma-mcp-server) configured in your Claude Code MCP settings
- Node.js 18+

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Run the full pipeline

Open Claude Code in this project directory and provide a Figma URL:

```
/figma-to-code https://www.figma.com/design/<file-key>/<file-name>?node-id=<node-id>
```

This single command runs the entire pipeline: extract tokens, map components, generate code, verify fidelity, and build.

### 3. Preview

```bash
npm run dev
```

Open http://localhost:5173 to see the generated page centered in the viewport.

## Technology Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5.7+ | Type safety (strict mode) |
| Vite | 6 | Build tool |
| Tailwind CSS | 4 | Utility-first CSS (CSS-first config, no `tailwind.config.ts`) |

Design tokens are defined via `@theme { }` blocks in `src/index.css` using Tailwind v4's CSS-first configuration.

## Project Structure

```
.claude/
  skills/                # Claude Code skill definitions (the compiler logic)
    design-tokens/       # Token extraction skill
    component-map/       # Component analysis skill
    gen-component/       # Component generation skill
    gen-page/            # Page generation skill
    figma-to-code/       # Full pipeline orchestrator
    verify-design/       # Design fidelity checker
.figma/
  component-map.json     # Generated component dependency graph
public/
  assets/                # Downloaded SVG/image assets from Figma
src/
  index.css              # Tailwind v4 @theme tokens
  main.tsx               # React entry point
  App.tsx                # Root component
  tokens/
    index.ts             # TypeScript token exports
  components/
    ui/                  # Atomic components (Button, Input, Badge, etc.)
    patterns/            # Composite components (Card, Navbar, Form, etc.)
  layouts/               # Layout components (Sidebar, Header, Grid)
  pages/                 # Full page compositions
```

## Available Skills

All skills are invoked as slash commands inside Claude Code. Pass a Figma URL as the argument.

### `/figma-to-code <figma-url>` — Full Pipeline

The main entry point. Runs all steps in order:

1. **Load generation rules** — reads all skill references into context
2. **Extract design tokens** — Figma variables become `@theme` CSS + TS exports
3. **Map components** — builds dependency graph + generation order
4. **Generate components** — creates each component in dependency order
5. **Generate pages** — composes components into full page layouts
6. **Verify fidelity** — compares generated code against Figma screenshots
7. **Build** — runs `npm run build` to confirm zero errors

Each step verifies before proceeding to the next. If any step fails, the pipeline stops with a clear error.

### `/design-tokens <figma-url>` — Extract Tokens

Reads Figma variables and generates:

- `src/index.css` — `@theme { }` block with colors, fonts, spacing, radii, shadows
- `src/tokens/index.ts` — TypeScript constants for programmatic access

Uses Tailwind v4 namespaces (`--color-*`, `--text-*`, `--leading-*`, `--radius-*`, etc.).

### `/component-map <figma-url>` — Analyze Components

Analyzes a Figma page and outputs `.figma/component-map.json` containing:

- Component list with Figma names and node IDs
- Classification: `ui` (atomic) vs `patterns` (composite)
- Dependency graph between components
- Topologically sorted generation order
- Multi-state variant detection (e.g., tab bars with `State=Tab1/Tab2/Tab3`)
- Icon variant override tracking (prevents Figma MCP asset export bugs)

### `/gen-component <figma-url>` — Generate Component

Generates a single React component from a Figma component node:

- Fetches design context + screenshot from Figma MCP
- Downloads all image/SVG assets to `public/assets/`
- Fixes SVG `preserveAspectRatio` distortion bug
- Translates Figma properties to Tailwind classes using exact values
- Handles multi-state variants with prop + callback pattern
- Uses semantic HTML (`<button>`, `<input>`, `<a>`) for interactive elements
- Verifies with `npx tsc --noEmit`

### `/gen-page <figma-url>` — Generate Page

Generates a full page by composing existing components:

- Uses exact Figma frame dimensions (e.g., `w-[375px] h-[812px]`)
- Positions containers with exact pixel offsets
- Wires `useState` for multi-state components (tab bars, toggles)
- Updates `App.tsx` with centered viewport wrapper

### `/verify-design <figma-url>` — Verify Fidelity

Read-only comparison of generated code against Figma. Checks:

- Colors, typography, spacing, borders, shadows
- Layout structure and dimensions
- Semantic HTML usage
- Asset integrity (no expired Figma URLs, no duplicate icons)
- Token namespace correctness
- Multi-state variant wiring

Outputs a structured PASS/FAIL report with specific file:line references.

## Known Figma MCP Limitations

The skills include built-in workarounds for these Figma MCP issues:

| Issue | Impact | Workaround |
|-------|--------|------------|
| **Icon Variant Swap Bug** | Icon component instances export the default variant's SVG instead of the overridden variant | Fetch assets from variant master nodes instead of instances |
| **SVG `preserveAspectRatio="none"`** | All exported SVGs stretch to fill containers, distorting non-square icons | Auto-replace with `"xMidYMid meet"` after download |
| **Complex SVG decomposition** | Logos/illustrations exported as 10+ individual mask/gradient SVG parts | Auto-combine into single SVG file |
| **Expired asset URLs** | MCP asset URLs expire after 7 days | All assets downloaded locally to `public/assets/` |

## Tailwind CSS v4 Token Namespaces

Tailwind v4 uses specific CSS custom property prefixes. Wrong names are **silently ignored** with no error.

| Token Type | Correct Prefix | Wrong (silently ignored) |
|-----------|---------------|------------------------|
| Font size | `--text-*` | ~~`--font-size-*`~~ |
| Line height | `--leading-*` | ~~`--line-height-*`~~ |
| Letter spacing | `--tracking-*` | ~~`--letter-spacing-*`~~ |
| Border radius | `--radius-*` | ~~`--border-radius-*`~~ |
| Colors | `--color-*` | (correct) |
| Font family | `--font-*` | (correct) |
| Spacing | `--spacing-*` | (correct) |

Compound font-size + line-height: `--text-lg: 24px` + `--text-lg--line-height: 48px`

## Scripts

```bash
npm run dev       # Start Vite dev server
npm run build     # TypeScript check + production build
npm run preview   # Preview production build
npm run format    # Format code with Prettier + Tailwind plugin
```

## Adding a New Figma Page

1. Open Claude Code in the project directory
2. Run `/figma-to-code <figma-url>` with the target page's URL
3. The pipeline handles everything: tokens, components, page, verification, build
4. Run `npm run dev` and open http://localhost:5173

To regenerate after Figma changes, run the same command again — it overwrites existing files.

## Customizing Skills

Skills are defined in `.claude/skills/*/SKILL.md` as markdown files with frontmatter. Each skill contains:

- **Procedure** — step-by-step instructions Claude Code follows
- **Rules** — constraints and patterns to enforce
- **CRITICAL sections** — mandatory checks that prevent common bugs

To modify the compiler's behavior, edit the relevant `SKILL.md` file. Changes take effect immediately on the next skill invocation.

## License

Private project.
