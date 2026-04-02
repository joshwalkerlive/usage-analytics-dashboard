import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { useTheme } from "@/context/ThemeContext";
import type { GoalDistribution } from "@/lib/types";

interface WantedChartProps {
  data: GoalDistribution[];
}

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

const BAR_COLORS = [
  "#818cf8", // indigo-400
  "#a78bfa", // violet-400
  "#c084fc", // purple-400
  "#e879f9", // fuchsia-400
  "#f472b6", // pink-400
  "#fb923c", // orange-400
  "#d7e260", // accent
  "#34d399", // emerald-400 (analytics)
  "#38bdf8", // sky-400 (content)
  "#f97316", // orange-500 (plugin)
  "#facc15", // yellow-400 (workflow)
  "#64748b", // slate-500 (unknown/other)
];

export function WantedChart({ data }: WantedChartProps) {
  const { currentTheme } = useTheme();

  const chartData = data
    .map((d) => ({
      name: CATEGORY_LABELS[d.category] ?? d.category,
      count: d.count,
      pct: d.percentage,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <ChartCard title="What You Wanted" subtitle="Session goals by category">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 12, bottom: 0, left: 80 }}
          >
            <XAxis
              type="number"
              tick={{ fill: currentTheme.colors.text.tertiary, fontSize: 11 }}
              axisLine={{ stroke: currentTheme.colors.border }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: currentTheme.colors.text.secondary, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={76}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: currentTheme.colors.bg.secondary,
                border: "1px solid " + currentTheme.colors.border,
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: currentTheme.colors.text.primary }}
              itemStyle={{ color: currentTheme.colors.text.secondary }}
              formatter={(value: number, _name: string, props: { payload?: { pct: number } }) => [
                `${value} (${props.payload?.pct ?? 0}%)`,
                "Sessions",
              ]}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((_entry, index) => (
                <Cell
                  key={index}
                  fill={BAR_COLORS[index % BAR_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
