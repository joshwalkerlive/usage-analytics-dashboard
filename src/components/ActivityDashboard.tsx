import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useTheme } from "@/context/ThemeContext";
import type { DailyMetric } from "@/lib/types";

interface ActivityDashboardProps {
  data: DailyMetric[];
}

const METRICS = [
  { key: "sessions", label: "Sessions", color: "#818cf8" },
  { key: "messages", label: "Messages", color: "#34d399" },
  { key: "toolCalls", label: "Tool Calls", color: "#fbbf24" },
  { key: "toolErrors", label: "Errors", color: "#f87171" },
  { key: "avgSatisfaction", label: "Satisfaction", color: "#a78bfa" },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDate(dateStr: string): string {
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
    });
  } catch {
    return dateStr;
  }
}

function interpolateColor(base: string, intensity: number): string {
  const hex = base.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const alpha = 0.1 + intensity * 0.8;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function ActivityDashboard({ data }: ActivityDashboardProps) {
  const { currentTheme } = useTheme();

  // Line graph state: multiple metrics
  const [activeLineMetrics, setActiveLineMetrics] = useState<Set<MetricKey>>(
    new Set(["sessions", "toolCalls"])
  );

  // Heatmap state: single metric
  const [heatmapMetric, setHeatmapMetric] = useState<MetricKey>("sessions");
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const heatmapConfig = METRICS.find((m) => m.key === heatmapMetric)!;

  const toggleLineMetric = (key: MetricKey) => {
    setActiveLineMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Build heatmap data structures
  const dataMap = useMemo(() => {
    const map = new Map<string, DailyMetric>();
    for (const d of data) map.set(d.date, d);
    return map;
  }, [data]);

  const { weeks, monthLabels } = useMemo(() => {
    if (data.length === 0) return { weeks: [], monthLabels: [] };
    const dates = data.map((d) => d.date).sort();
    const startDate = new Date(dates[0] + "T00:00:00");
    const endDate = new Date(dates[dates.length - 1] + "T00:00:00");

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

  const maxHeatmapValue = useMemo(() => {
    let max = 1;
    for (const d of data) {
      const val = d[heatmapMetric];
      if (val > max) max = val;
    }
    return max;
  }, [data, heatmapMetric]);

  if (data.length === 0) return null;

  const cellSize = 13;
  const cellGap = 2;
  const stride = cellSize + cellGap;

  // Determine which day's metrics to display (hovered or latest)
  const displayDay = hoveredDay || data[data.length - 1]?.date || null;
  const displayData = displayDay ? dataMap.get(displayDay) : null;

  return (
    <div className="space-y-3">
      {/* Top row: toggle pills right-aligned */}
      <div className="flex items-end justify-end gap-4 flex-wrap">
        {/* Heatmap toggles (single-select) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] text-navy-600 mr-1">Heatmap</span>
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setHeatmapMetric(m.key)}
              className={`
                px-2.5 py-1 text-[10px] font-medium rounded-full
                transition-all duration-200 border
                ${
                  heatmapMetric === m.key
                    ? "text-white border-transparent"
                    : "text-navy-400 border-navy-700 hover:text-navy-200 hover:border-navy-500"
                }
              `}
              style={
                heatmapMetric === m.key
                  ? { backgroundColor: m.color + "30", borderColor: m.color + "60" }
                  : undefined
              }
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Line graph toggles (multi-select) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] text-navy-600 mr-1">Lines</span>
          {METRICS.map((m) => {
            const isActive = activeLineMetrics.has(m.key);
            return (
              <button
                key={m.key}
                onClick={() => toggleLineMetric(m.key)}
                className={`
                  px-2.5 py-1 text-[10px] font-medium rounded-full
                  transition-all duration-200 border
                  ${
                    isActive
                      ? "text-white border-transparent"
                      : "text-navy-400 border-navy-700 hover:text-navy-200 hover:border-navy-500"
                  }
                `}
                style={
                  isActive
                    ? { backgroundColor: m.color + "30", borderColor: m.color + "60" }
                    : undefined
                }
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart card with overlaid heatmap + metrics */}
      <div className="bg-navy-900/50 border border-navy-700/50 rounded-xl p-6 relative">
        {/* Daily metrics overlay — top-left */}
        <div className="flex items-center gap-4 text-[10px] text-navy-300 mb-2">
          <span className="text-navy-100 font-medium">
            {displayDay ? formatDateFull(displayDay) : "—"}
          </span>
          {METRICS.map((m) => (
            <span key={m.key}>
              <span style={{ color: m.color }}>{m.label}:</span>{" "}
              {displayData ? displayData[m.key] : 0}
            </span>
          ))}
        </div>

        {/* Line chart with heatmap overlay */}
        <div className="relative">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {METRICS.map((m) => (
                  <linearGradient key={m.key} id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={m.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={m.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: currentTheme.colors.text.tertiary, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: currentTheme.colors.text.tertiary, fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: currentTheme.colors.bg.secondary,
                  border: `1px solid ${currentTheme.colors.border}`,
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: currentTheme.colors.text.primary,
                }}
                labelFormatter={formatDate}
              />
              {METRICS.map((m) =>
                activeLineMetrics.has(m.key) ? (
                  <Area
                    key={m.key}
                    type="monotone"
                    dataKey={m.key}
                    name={m.label}
                    stroke={m.color}
                    strokeWidth={2}
                    fill={`url(#grad-${m.key})`}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0 }}
                  />
                ) : null
              )}
            </AreaChart>
          </ResponsiveContainer>

          {/* Heatmap overlay — upper-left of chart */}
          <div
            className="absolute top-1 overflow-hidden pointer-events-auto"
            style={{ left: 50, right: "auto", opacity: 0.85 }}
          >
            <div className="overflow-x-auto">
              <div className="inline-flex items-start">
                {/* Weekday labels */}
                <div
                  className="flex flex-col justify-between pr-1 flex-shrink-0"
                  style={{ height: 7 * stride - cellGap }}
                >
                  {WEEKDAYS.map((day, i) => (
                    <span
                      key={day}
                      className="text-[8px] text-navy-600 leading-none"
                      style={{ height: cellSize, lineHeight: cellSize + "px" }}
                    >
                      {i % 2 === 1 ? day.charAt(0) : ""}
                    </span>
                  ))}
                </div>

                {/* Grid */}
                <div className="flex" style={{ gap: cellGap }}>
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col" style={{ gap: cellGap }}>
                      {week.map((day) => {
                        const metric = dataMap.get(day.date);
                        const value = metric ? metric[heatmapMetric] : 0;
                        const intensity = maxHeatmapValue > 0 ? value / maxHeatmapValue : 0;
                        const isHovered = hoveredDay === day.date;

                        return (
                          <div
                            key={day.date}
                            className="rounded-sm transition-all duration-150 cursor-default"
                            style={{
                              width: cellSize,
                              height: cellSize,
                              backgroundColor: metric
                                ? interpolateColor(heatmapConfig.color, intensity)
                                : "rgba(255,255,255,0.02)",
                              outline: isHovered
                                ? `1px solid ${heatmapConfig.color}`
                                : "none",
                              transform: isHovered ? "scale(1.4)" : "none",
                              zIndex: isHovered ? 10 : 0,
                              position: "relative",
                            }}
                            onMouseEnter={() => setHoveredDay(day.date)}
                            onMouseLeave={() => setHoveredDay(null)}
                            title={
                              metric
                                ? `${formatDateFull(day.date)} \u2022 ${heatmapConfig.label}: ${value}`
                                : `${formatDateFull(day.date)} \u2022 No activity`
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
        </div>
      </div>
    </div>
  );
}
