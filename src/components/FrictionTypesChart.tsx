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
import type { FrictionTypeStat } from "@/lib/types";

interface FrictionTypesChartProps {
  data: FrictionTypeStat[];
}

const FRICTION_COLORS = [
  "#f87171", // red-400
  "#fb923c", // orange-400
  "#fbbf24", // amber-400
  "#818cf8", // indigo-400
  "#a78bfa", // violet-400
  "#64748b", // slate-500
];

export function FrictionTypesChart({ data }: FrictionTypesChartProps) {
  const { currentTheme } = useTheme();

  const chartData = data
    .map((d) => ({
      name: d.type,
      count: d.count,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <ChartCard title="Friction Types" subtitle="Categories of friction encountered">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 12, bottom: 0, left: 100 }}
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
              width={96}
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
              formatter={(value: number) => [value, "Occurrences"]}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
              {chartData.map((_entry, index) => (
                <Cell
                  key={index}
                  fill={FRICTION_COLORS[index % FRICTION_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
