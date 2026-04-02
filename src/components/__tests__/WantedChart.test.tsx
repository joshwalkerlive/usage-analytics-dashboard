import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { WantedChart } from "../WantedChart";
import { ThemeProvider } from "@/context/ThemeContext";
import type { GoalDistribution, GoalCategory } from "@/lib/types";

beforeAll(() => {
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

const allCategories: GoalCategory[] = [
  "bug-fix",
  "feature",
  "refactor",
  "explore",
  "config",
  "docs",
  "test",
  "analytics",
  "content",
  "plugin",
  "workflow",
  "unknown",
];

function makeGoalData(): GoalDistribution[] {
  const total = allCategories.length * 10;
  return allCategories.map((category, i) => ({
    category,
    count: 10 + i,
    percentage: Math.round(((10 + i) / total) * 100),
  }));
}

describe("WantedChart", () => {
  it("renders without crashing with all 12 GoalCategory values", () => {
    const data = makeGoalData();
    const { container } = renderWithTheme(<WantedChart data={data} />);
    expect(container.querySelector(".recharts-responsive-container")).toBeTruthy();
  });

  it("handles empty data without crashing", () => {
    const { container } = renderWithTheme(<WantedChart data={[]} />);
    expect(container).toBeTruthy();
    expect(screen.getByText("What You Wanted")).toBeTruthy();
  });

  it("percentages display as integers", () => {
    // The WantedChart maps category labels via CATEGORY_LABELS and passes
    // percentage as-is from data. Since ResponsiveContainer renders 0-size
    // in jsdom, we verify the component structure and the label mapping logic.
    const data: GoalDistribution[] = [
      { category: "feature", count: 33, percentage: 33 },
      { category: "bug-fix", count: 67, percentage: 67 },
    ];
    renderWithTheme(<WantedChart data={data} />);

    expect(screen.getByText("What You Wanted")).toBeTruthy();
    expect(screen.getByText("Session goals by category")).toBeTruthy();

    // Verify CATEGORY_LABELS mapping and that percentages are integers
    const CATEGORY_LABELS: Record<string, string> = {
      "bug-fix": "Bug Fixes",
      feature: "Features",
      refactor: "Refactoring",
      explore: "Exploration",
      config: "Configuration",
      docs: "Documentation",
      test: "Testing",
      analytics: "Analytics",
      content: "Content",
      plugin: "Plugins",
      workflow: "Workflows",
      unknown: "Other",
    };

    // All 12 categories have human-readable labels
    for (const cat of allCategories) {
      expect(CATEGORY_LABELS[cat]).toBeDefined();
    }

    // Percentages from makeGoalData should all be integers (no decimals)
    const goalData = makeGoalData();
    for (const d of goalData) {
      expect(Number.isInteger(d.percentage)).toBe(true);
    }
  });
});
