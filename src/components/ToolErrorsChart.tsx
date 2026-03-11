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
import type { ToolErrorStat } from "@/lib/types";

interface ToolErrorsChartProps {
  data: ToolErrorStat[];
}

const ERROR_COLORS = [
  "#f87171", // red-400
  "#fb923c", // orange-400
  "#fbbf24", // amber-400
  "#a78bfa", // violet-400
  "#818cf8", // indigo-400
];

export function ToolErrorsChart({ data }: ToolErrorsChartProps) {
  const { currentTheme } = useTheme();

  const chartData = data
    .map((d) => ({
      name: d.errorType,
      count: d.count,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <ChartCard title="Tool Errors" subtitle="Error categories across tool calls">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fill: currentTheme.colors.text.tertiary, fontSize: 11 }}
              axisLine={{ stroke: currentTheme.colors.border }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: currentTheme.colors.text.tertiary, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
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
              formatter={(value: number) => [value, "Errors"]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={36}>
              {chartData.map((_entry, index) => (
                <Cell
                  key={index}
                  fill={ERROR_COLORS[index % ERROR_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
