import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartCard } from "./ChartCard";
import { useTheme } from "@/context/ThemeContext";
import type { TimeOfDayBucket } from "@/lib/types";

interface TimeOfDayChartProps {
  data: TimeOfDayBucket[];
}

const TZ_OFFSETS = [
  { label: "Local", offset: 0 },
  { label: "UTC", offset: -new Date().getTimezoneOffset() / 60 },
  { label: "PST (UTC-8)", offset: 8 + new Date().getTimezoneOffset() / 60 },
  { label: "EST (UTC-5)", offset: 5 + new Date().getTimezoneOffset() / 60 },
  { label: "CET (UTC+1)", offset: -(1 + new Date().getTimezoneOffset() / 60) },
];

const PERIOD_ORDER = ["Morning", "Afternoon", "Evening", "Night"];

function recomputeBuckets(
  data: TimeOfDayBucket[],
  offsetHours: number
): { period: string; count: number }[] {
  // Flatten all raw hours, apply offset, re-bucket
  const allHours: number[] = [];
  for (const bucket of data) {
    allHours.push(...bucket.hours);
  }

  const shifted = allHours.map((h) => {
    const adjusted = (h + offsetHours) % 24;
    return adjusted < 0 ? adjusted + 24 : adjusted;
  });

  const buckets: Record<string, number> = {
    Morning: 0,
    Afternoon: 0,
    Evening: 0,
    Night: 0,
  };

  for (const h of shifted) {
    if (h >= 6 && h < 12) buckets["Morning"]++;
    else if (h >= 12 && h < 17) buckets["Afternoon"]++;
    else if (h >= 17 && h < 22) buckets["Evening"]++;
    else buckets["Night"]++;
  }

  return PERIOD_ORDER.map((period) => ({
    period,
    count: buckets[period],
  }));
}

const BAR_COLORS: Record<string, string> = {
  Morning: "#fbbf24",   // amber-400
  Afternoon: "#d7e260", // accent
  Evening: "#818cf8",   // indigo-400
  Night: "#6366f1",     // indigo-500
};

export function TimeOfDayChart({ data }: TimeOfDayChartProps) {
  const { currentTheme } = useTheme();
  const [tzIndex, setTzIndex] = useState(3); // Default to EST

  const chartData = useMemo(() => {
    if (tzIndex === 0) {
      // Local — use the pre-computed buckets
      return PERIOD_ORDER.map((period) => {
        const match = data.find((d) => d.period === period);
        return { period, count: match?.count ?? 0 };
      });
    }
    return recomputeBuckets(data, TZ_OFFSETS[tzIndex].offset);
  }, [data, tzIndex]);

  return (
    <ChartCard title="Time of Day" subtitle="When you code with Claude">
      <div className="flex justify-end mb-3">
        <select
          value={tzIndex}
          onChange={(e) => setTzIndex(Number(e.target.value))}
          className="bg-navy-800 border border-navy-600 text-navy-200 text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {TZ_OFFSETS.map((tz, i) => (
            <option key={i} value={i}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
          >
            <XAxis
              dataKey="period"
              tick={{ fill: currentTheme.colors.text.tertiary, fontSize: 12 }}
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
              formatter={(value: number) => [value, "Messages"]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={BAR_COLORS[entry.period] ?? "#818cf8"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
