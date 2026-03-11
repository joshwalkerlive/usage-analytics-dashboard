# Usage Analytics Dashboard — Context Handoff

> **Purpose:** Reference document for starting new Claude Code sessions on this project.
> Paste relevant sections into your first message to avoid cold-start exploration.

---

## Project Overview

React + TypeScript + Tailwind CSS + Recharts + Vite dashboard displaying Claude Code usage analytics.

- **Dev server:** npm run dev at localhost:5173
- **Stack:** React 18, TypeScript, Tailwind CSS, Recharts, Vite
- **Theme system:** React Context (src/context/ThemeContext.tsx) with 5 themes: morning, day, evening, dark, retro (default: retro)
- **Entry:** src/main.tsx then src/App.tsx (409 lines, 20 sections/modules)

---

## Completed Work

### Category 1: NavTOC Frosted Glass + Remove Glow — DONE

**File:** src/components/NavTOC.tsx (89 lines)

Changes made:
- Added useTheme import from context/ThemeContext
- Added hexToRgba helper using parseInt with clean.slice() pattern (NOT regex — regex triggers security hook false positive)
- Replaced hardcoded gradient background with theme-aware frosted glass using hexToRgba(bgPrimary, 0.65), backdropFilter blur(20px), WebkitBackdropFilter blur(20px)
- Removed neon glow div, hover underline div, textShadow, relative group classes from buttons
- Simplified button to just padding, text-xs, font-medium, rounded-md, transition with active/inactive color toggle

---

## Remaining Work (4 Categories)

### Category 2: Header/Hero Restructure

**File:** src/components/Header.tsx (112 lines)

Goal: Rearrange layout so metrics are on the left, dates + upload button on the right. Currently everything is stacked vertically.

### Category 3: Chart Tooltip Readability + Theme Color Tokens

**Files:** All chart components in src/components/ that use Recharts Tooltip

**Problem:** Tooltip text is unreadable (dark text on dark background).

**Fix needed:**
- Add contentStyle, labelStyle, itemStyle props to all Tooltip components with readable colors
- Wire up the unused theme chart color tokens (chartPrimary, chartSecondary, chartPositive, chartNegative, chartNeutral) from ThemeContext into actual Recharts Bar, Line, Area, Cell fill/stroke props

**Chart components to update (11 files):**
- FrictionTypesChart.tsx
- HelpfulChart.tsx
- InferredSatisfactionChart.tsx
- LanguagesChart.tsx
- OutcomesChart.tsx
- ResponseTimeChart.tsx
- SessionTypesChart.tsx
- TimeOfDayChart.tsx
- ToolErrorsChart.tsx
- TopToolsChart.tsx
- WantedChart.tsx

### Category 4: Morning Theme Sunrise Gradient

**File:** src/context/ThemeContext.tsx (or CSS/component level)

Goal: Add a dynamic sunrise gradient background when morning theme is active. Warm oranges/pinks at bottom fading to light blue at top.

### Category 5: Retro Theme Enhancements

**Files:** src/index.css, src/context/ThemeContext.tsx, potentially new components

Goal: Make retro theme more playful 1980s aesthetic:
- Pixel art decorative elements
- 1980s-style borders (double-line, beveled)
- Animated pixel art (falling pixels, scrolling starfield)
- Easter egg: Pong mini-game

---

## Key Architecture Notes

### Theme System (src/context/ThemeContext.tsx)

Usage in any component:

    import { useTheme } from "@/context/ThemeContext";
    const { currentTheme, theme, setTheme } = useTheme();

Access colors:

    currentTheme.colors.bg.primary    // e.g. "#0a0f1e"
    currentTheme.colors.text.primary  // e.g. "#e2e8f0"
    currentTheme.colors.accent        // e.g. "#60a5fa"

Chart colors (CURRENTLY UNUSED - need to wire into Recharts):

    currentTheme.colors.chart.primary
    currentTheme.colors.chart.secondary
    currentTheme.colors.chart.positive
    currentTheme.colors.chart.negative
    currentTheme.colors.chart.neutral

### Frosted Glass Pattern (used in Header.tsx and NavTOC.tsx)

Helper function (MUST use parseInt with slice, NOT regex):

    function hexToRgba(hex: string, alpha: number): string {
      const clean = hex.replace("#", "");
      if (clean.length !== 6) return "rgba(0,0,0," + alpha + ")";
      const r = parseInt(clean.slice(0, 2), 16);
      const g = parseInt(clean.slice(2, 4), 16);
      const b = parseInt(clean.slice(4, 6), 16);
      return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
    }

Applied as inline style:

    style={{
      backgroundColor: hexToRgba(bgPrimary, 0.65),
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}

### Retro Theme CSS (src/index.css)

Lines 38-67 contain retro-specific styles:
- [data-theme="retro"] selector for scoping
- Scanline overlay effect
- Pixel font imports (Press Start 2P, VT323)
- border-radius: 0 for square corners
- CRT glow text-shadow

---

## File Map (Key Files)

    src/
    |- main.tsx              # Entry point
    |- App.tsx               # Main app layout (409 lines, 20 sections)
    |- index.css             # Tailwind + retro theme CSS
    |- context/
    |  |- ThemeContext.tsx    # 5 themes, useTheme() hook (310 lines)
    |- components/
    |  |- Header.tsx         # Hero header with frosted glass (112 lines)
    |  |- NavTOC.tsx         # Sticky nav, frosted glass - DONE
    |  |- AtAGlance.tsx      # 4 quadrant summary cards
    |  |- MetricsWithSparklines.tsx
    |  |- ChartCard.tsx      # Wrapper for all charts
    |  |- ChartsGrid.tsx     # Grid layout for charts
    |  |- [11 chart files]   # Individual Recharts charts
    |  |- ThemeSelector.tsx  # Theme picker UI
    |  |- [other sections]
    |- lib/
       |- types.ts
       |- metrics.ts
       |- dashboard-data.ts
       |- insights-types.ts
       |- insights-loader.ts
       |- jsonl-parser.ts

---

## Compaction Loop Prevention

Root cause (diagnosed): 300+ MCP tool definitions + 100+ skill listings consumed most of the context window before any work began.

Mitigations applied:
1. Deleted plan file at ~/.claude/plans/logical-wibbling-sonnet.md
2. Created project-level .claude/settings.json disabling 37/39 plugins (only typescript-lsp and context7 enabled)
3. Note: Claude Desktop extensions (Neon, ClickUp, Chrome, Excel, Word, etc.) still load — disable those in Claude Desktop UI if needed

Best practices for this project:
- Use Edit tool (sends diffs) instead of Write (sends full file) to save tokens
- Read files only once per session, do not re-read unchanged files
- Work on one category at a time, complete it before moving to the next
- Keep responses short
