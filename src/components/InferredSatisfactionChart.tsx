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
import type { InferredSatisfaction } from "@/lib/types";

interface InferredSatisfactionChartProps {
  data: InferredSatisfaction[];
}

const SATISFACTION_COLORS: Record<string, string> = {
  "Very Satisfied": "#34d399",  // emerald-400
  "Satisfied": "#d7e260",       // accent
  "Neutral": "#94a3b8",         // slate-400
  "Frustrated": "#fb923c",      // orange-400
  "Very Frustrated": "#f87171", // red-400
};

const FALLBACK_COLOR = "#818cf8";

// Ensure consistent ordering from positive to negative
const LEVEL_ORDER = [
  "Very Satisfied",
  "Satisfied",
  "Neutral",
  "Frustrated",
  "Very Frustrated",
];

export function InferredSatisfactionChart({
  data,
}: InferredSatisfactionChartProps) {
  const { currentTheme } = useTheme();

  const chartData = LEVEL_ORDER.map((level) => {
    const match = data.find((d) => d.level === level);
    return { level, count: match?.count ?? 0 };
  }).filter((d) => d.count > 0 || data.length === 0);

  // If data has levels not in our predefined order, append them
  for (const d of data) {
    if (!LEVEL_ORDER.includes(d.level)) {
      chartData.push({ level: d.level, count: d.count });
    }
  }

  return (
    <ChartCard
      title="Inferred Satisfaction"
      subtitle="Session satisfaction levels"
    >
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
          >
            <XAxis
              dataKey="level"
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
              formatter={(value: number) => [value, "Sessions"]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={36}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={SATISFACTION_COLORS[entry.level] ?? FALLBACK_COLOR}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
