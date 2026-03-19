import { useState } from "react";
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

interface UsageTimelineProps {
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

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function UsageTimeline({ data }: UsageTimelineProps) {
  const { currentTheme } = useTheme();
  const [activeMetrics, setActiveMetrics] = useState<Set<MetricKey>>(
    new Set(["sessions", "toolCalls"])
  );

  if (data.length === 0) return null;

  const toggleMetric = (key: MetricKey) => {
    setActiveMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const accent = currentTheme.colors.accent;

  return (
    <div className="bg-navy-900/50 border border-navy-700/50 rounded-xl p-6">
      {/* Metric toggle pills */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {METRICS.map((m) => {
          const isActive = activeMetrics.has(m.key);
          return (
            <button
              key={m.key}
              onClick={() => toggleMetric(m.key)}
              className={`
                px-3 py-1 text-[10px] font-medium rounded-full
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
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: m.color, opacity: isActive ? 1 : 0.3 }}
              />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={200}>
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
            activeMetrics.has(m.key) ? (
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
    </div>
  );
}
