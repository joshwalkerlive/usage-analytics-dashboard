import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { useTheme } from "@/context/ThemeContext";
import type { ToolUsageStat } from "@/lib/types";

interface TopToolsChartProps {
  data: ToolUsageStat[];
}

export function TopToolsChart({ data }: TopToolsChartProps) {
  const { currentTheme } = useTheme();

  const chartData = data
    .slice(0, 10)
    .map((d) => ({
      name: d.tool,
      calls: d.count,
      errors: d.errorCount,
      errorRate: d.errorRate,
    }))
    .sort((a, b) => b.calls - a.calls);

  return (
    <ChartCard title="Top Tools" subtitle="Most used tools by call count">
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
              formatter={(value: number, name: string) => {
                const label = name === "calls" ? "Calls" : "Errors";
                return [value, label];
              }}
            />
            <Bar
              dataKey="calls"
              fill={currentTheme.colors.chartPrimary}
              radius={[0, 4, 4, 0]}
              barSize={18}
            />
            <Bar
              dataKey="errors"
              fill={currentTheme.colors.chartNegative}
              radius={[0, 4, 4, 0]}
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
