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
import type { ResponseTimeBucket } from "@/lib/types";

interface ResponseTimeChartProps {
  data: ResponseTimeBucket[];
}

export function ResponseTimeChart({ data }: ResponseTimeChartProps) {
  const { currentTheme } = useTheme();

  const chartData = data.map((d) => ({
    range: d.range,
    count: d.count,
    medianMs: d.medianMs,
  }));

  return (
    <ChartCard
      title="Response Times"
      subtitle="Distribution of user response delays between messages"
    >
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
          >
            <XAxis
              dataKey="range"
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
            <Bar
              dataKey="count"
              fill={currentTheme.colors.chartPrimary}
              radius={[4, 4, 0, 0]}
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
