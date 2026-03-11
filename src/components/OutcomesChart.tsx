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
import type { OutcomeStat } from "@/lib/types";

interface OutcomesChartProps {
  data: OutcomeStat[];
}

const OUTCOME_COLORS: Record<string, string> = {
  "Completed": "#34d399",   // emerald-400
  "Partial": "#fbbf24",     // amber-400
  "Abandoned": "#f87171",   // red-400
  "Unknown": "#64748b",     // slate-500
};

const FALLBACK_COLORS = [
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#64748b",
  "#818cf8",
  "#a78bfa",
];

export function OutcomesChart({ data }: OutcomesChartProps) {
  const { currentTheme } = useTheme();

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const chartData = data.map((d) => ({
    name: d.outcome,
    value: d.count,
    pct: total > 0 ? Math.round((d.count / total) * 100) : 0,
  }));

  return (
    <ChartCard title="Outcomes" subtitle="How sessions ended">
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
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    OUTCOME_COLORS[entry.name] ??
                    FALLBACK_COLORS[index % FALLBACK_COLORS.length]
                  }
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
              formatter={(
                value: number,
                _name: string,
                props: { payload?: { pct: number } }
              ) => [`${value} (${props.payload?.pct ?? 0}%)`, "Sessions"]}
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
