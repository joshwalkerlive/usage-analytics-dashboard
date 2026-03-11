import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { useTheme } from "@/context/ThemeContext";
import type { SessionTypeStat } from "@/lib/types";

interface SessionTypesChartProps {
  data: SessionTypeStat[];
}

const PIE_COLORS = [
  "#818cf8", // indigo-400
  "#d7e260", // accent
  "#34d399", // emerald-400
  "#f472b6", // pink-400
  "#fb923c", // orange-400
  "#a78bfa", // violet-400
  "#38bdf8", // sky-400
];

export function SessionTypesChart({ data }: SessionTypesChartProps) {
  const { currentTheme } = useTheme();

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const chartData = data.map((d) => ({
    name: d.type,
    value: d.count,
    pct: total > 0 ? Math.round((d.count / total) * 100) : 0,
  }));

  return (
    <ChartCard title="Session Types" subtitle="How sessions are classified">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              dataKey="value"
              stroke="none"
              paddingAngle={2}
            >
              {chartData.map((_entry, index) => (
                <Cell
                  key={index}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>
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
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: currentTheme.colors.text.tertiary }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
