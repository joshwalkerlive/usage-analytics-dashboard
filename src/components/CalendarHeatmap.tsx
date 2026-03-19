import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/context/ThemeContext";
import type { DailyMetric } from "@/lib/types";

interface CalendarHeatmapProps {
  data: DailyMetric[];
}

const HEATMAP_METRICS = [
  { key: "sessions", label: "Sessions", color: "#818cf8" },
  { key: "messages", label: "Messages", color: "#34d399" },
  { key: "toolCalls", label: "Tool Calls", color: "#fbbf24" },
  { key: "toolErrors", label: "Errors", color: "#f87171" },
  { key: "avgSatisfaction", label: "Satisfaction", color: "#a78bfa" },
] as const;

type HeatmapMetricKey = (typeof HEATMAP_METRICS)[number]["key"];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDateShort(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatDateFull(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function interpolateColor(
  base: string,
  intensity: number
): string {
  // Convert hex to RGB, then mix with dark background
  const hex = base.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const alpha = 0.1 + intensity * 0.8;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function CalendarHeatmap({ data }: CalendarHeatmapProps) {
  const { currentTheme } = useTheme();
  const [selectedMetric, setSelectedMetric] = useState<HeatmapMetricKey>("sessions");
  const [showLineOverlay, setShowLineOverlay] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const metricConfig = HEATMAP_METRICS.find((m) => m.key === selectedMetric)!;

  // Build a map of date → DailyMetric
  const dataMap = useMemo(() => {
    const map = new Map<string, DailyMetric>();
    for (const d of data) map.set(d.date, d);
    return map;
  }, [data]);

  // Build the calendar grid
  const { weeks, monthLabels } = useMemo(() => {
    if (data.length === 0) return { weeks: [], monthLabels: [] };

    const dates = data.map((d) => d.date).sort();
    const startDate = new Date(dates[0] + "T00:00:00");
    const endDate = new Date(dates[dates.length - 1] + "T00:00:00");

    // Extend to full weeks
    const gridStart = new Date(startDate);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());
    const gridEnd = new Date(endDate);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

    const weeks: { date: string; dayOfWeek: number }[][] = [];
    const monthLabels: { label: string; weekIndex: number }[] = [];
    let currentWeek: { date: string; dayOfWeek: number }[] = [];
    let lastMonth = -1;

    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      const dateStr = cursor.toISOString().slice(0, 10);
      const dow = cursor.getDay();

      if (dow === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      const month = cursor.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({
          label: cursor.toLocaleDateString("en-US", { month: "short" }),
          weekIndex: weeks.length,
        });
        lastMonth = month;
      }

      currentWeek.push({ date: dateStr, dayOfWeek: dow });
      cursor.setDate(cursor.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return { weeks, monthLabels };
  }, [data]);

  // Compute max value for intensity scaling
  const maxValue = useMemo(() => {
    let max = 1;
    for (const d of data) {
      const val = d[selectedMetric];
      if (val > max) max = val;
    }
    return max;
  }, [data, selectedMetric]);

  if (data.length === 0) return null;

  const cellSize = 14;
  const cellGap = 3;
  const stride = cellSize + cellGap;

  return (
    <div className="bg-navy-900/50 border border-navy-700/50 rounded-xl p-6">
      {/* Controls row */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {HEATMAP_METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedMetric(m.key)}
              className={`
                px-3 py-1 text-[10px] font-medium rounded-full
                transition-all duration-200 border
                ${
                  selectedMetric === m.key
                    ? "text-white border-transparent"
                    : "text-navy-400 border-navy-700 hover:text-navy-200 hover:border-navy-500"
                }
              `}
              style={
                selectedMetric === m.key
                  ? { backgroundColor: m.color + "30", borderColor: m.color + "60" }
                  : undefined
              }
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowLineOverlay(!showLineOverlay)}
          className={`
            px-3 py-1 text-[10px] font-medium rounded-full
            transition-all duration-200 border
            ${
              showLineOverlay
                ? "text-white bg-white/10 border-white/20"
                : "text-navy-400 border-navy-700 hover:text-navy-200"
            }
          `}
        >
          {showLineOverlay ? "Hide" : "Show"} Line Graph
        </button>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex ml-8" style={{ gap: 0 }}>
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="text-[9px] text-navy-500"
                style={{
                  position: "relative",
                  left: m.weekIndex * stride,
                  width: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex gap-0 mt-1">
            {/* Weekday labels */}
            <div className="flex flex-col justify-between pr-2" style={{ height: 7 * stride - cellGap }}>
              {WEEKDAYS.map((day, i) => (
                <span
                  key={day}
                  className="text-[9px] text-navy-500 leading-none"
                  style={{ height: cellSize, lineHeight: cellSize + "px" }}
                >
                  {i % 2 === 1 ? day : ""}
                </span>
              ))}
            </div>

            {/* Grid cells */}
            <div className="flex" style={{ gap: cellGap }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: cellGap }}>
                  {week.map((day) => {
                    const metric = dataMap.get(day.date);
                    const value = metric ? metric[selectedMetric] : 0;
                    const intensity = maxValue > 0 ? value / maxValue : 0;
                    const isHovered = hoveredDay === day.date;

                    return (
                      <div
                        key={day.date}
                        className="rounded-sm transition-all duration-150 cursor-default"
                        style={{
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: metric
                            ? interpolateColor(metricConfig.color, intensity)
                            : "rgba(255,255,255,0.03)",
                          outline: isHovered ? `1px solid ${metricConfig.color}` : "none",
                          transform: isHovered ? "scale(1.3)" : "none",
                        }}
                        onMouseEnter={() => setHoveredDay(day.date)}
                        onMouseLeave={() => setHoveredDay(null)}
                        title={
                          metric
                            ? `${formatDateFull(day.date)}\n${metricConfig.label}: ${value}`
                            : `${formatDateFull(day.date)}\nNo activity`
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hovered day detail */}
      {hoveredDay && dataMap.has(hoveredDay) && (
        <div className="mt-3 flex items-center gap-4 text-[10px] text-navy-300">
          <span className="text-navy-100 font-medium">{formatDateFull(hoveredDay)}</span>
          {HEATMAP_METRICS.map((m) => (
            <span key={m.key}>
              <span style={{ color: m.color }}>{m.label}:</span>{" "}
              {dataMap.get(hoveredDay)![m.key]}
            </span>
          ))}
        </div>
      )}

      {/* Optional line graph overlay */}
      {showLineOverlay && (
        <div className="mt-4 border-t border-navy-700/50 pt-4">
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tickFormatter={formatDateShort}
                tick={{ fill: currentTheme.colors.text.tertiary, fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: currentTheme.colors.text.tertiary, fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: currentTheme.colors.bg.secondary,
                  border: `1px solid ${currentTheme.colors.border}`,
                  borderRadius: "8px",
                  fontSize: "10px",
                  color: currentTheme.colors.text.primary,
                }}
                labelFormatter={formatDateFull}
              />
              <Line
                type="monotone"
                dataKey={selectedMetric}
                name={metricConfig.label}
                stroke={metricConfig.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
