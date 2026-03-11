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
import type { HelpfulFactorStat } from "@/lib/types";

interface HelpfulChartProps {
  data: HelpfulFactorStat[];
}

const HELPFUL_COLORS = [
  "#34d399", // emerald-400
  "#d7e260", // accent
  "#818cf8", // indigo-400
  "#38bdf8", // sky-400
  "#a78bfa", // violet-400
  "#fbbf24", // amber-400
];

export function HelpfulChart({ data }: HelpfulChartProps) {
  const { currentTheme } = useTheme();

  const chartData = data
    .map((d) => ({
      name: d.factor,
      count: d.count,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <ChartCard title="What Helped" subtitle="Factors that made sessions productive">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 12, bottom: 0, left: 90 }}
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
              width={86}
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
              formatter={(value: number) => [value, "Sessions"]}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
              {chartData.map((_entry, index) => (
                <Cell
                  key={index}
                  fill={HELPFUL_COLORS[index % HELPFUL_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
