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
import type { LanguageStat } from "@/lib/types";

interface LanguagesChartProps {
  data: LanguageStat[];
}

const LANG_COLORS = [
  "#d7e260", // accent
  "#818cf8", // indigo-400
  "#a78bfa", // violet-400
  "#34d399", // emerald-400
  "#f472b6", // pink-400
  "#fb923c", // orange-400
  "#38bdf8", // sky-400
  "#c084fc", // purple-400
];

export function LanguagesChart({ data }: LanguagesChartProps) {
  const { currentTheme } = useTheme();

  const chartData = data
    .slice(0, 8)
    .map((d) => ({
      name: d.language,
      files: d.fileCount,
    }));

  return (
    <ChartCard title="Languages" subtitle="Files touched by language">
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
              formatter={(value: number) => [value, "Files"]}
            />
            <Bar dataKey="files" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((_entry, index) => (
                <Cell
                  key={index}
                  fill={LANG_COLORS[index % LANG_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
