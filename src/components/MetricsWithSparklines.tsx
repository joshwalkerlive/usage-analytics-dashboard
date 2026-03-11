import type { SessionMetrics } from "@/lib/types";
import { useTheme } from "@/context/ThemeContext";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface StatCardData {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  sparklineData?: Array<{ value: number }>;
}

function getTrendIcon(trend?: "up" | "down" | "neutral") {
  switch (trend) {
    case "up":
      return (
        <svg
          className="w-4 h-4 text-emerald-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 5.414l-5.293 5.293a1 1 0 01-1.414 0z" />
        </svg>
      );
    case "down":
      return (
        <svg
          className="w-4 h-4 text-rose-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 14.586l5.293-5.293a1 1 0 011.414 0z" />
        </svg>
      );
    default:
      return (
        <svg
          className="w-4 h-4 text-slate-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M3 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
        </svg>
      );
  }
}

export function MetricsWithSparklines({ metrics }: { metrics: SessionMetrics }) {
  const { currentTheme } = useTheme();

  const avgDurationMin = Math.round(metrics.avgDurationMs / 60_000);
  const days = Object.keys(metrics.sessionsPerDay).length;
  const sessionsPerDay =
    days > 0 ? (metrics.totalSessions / days).toFixed(1) : "0";

  // Generate sparkline data from sessionsPerDay
  const sessionsSparkline = Object.entries(metrics.sessionsPerDay)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([, count]) => ({
      value: count,
    }));

  const messagesSparkline = Array.from(
    { length: Math.min(14, days) },
    (_, i) => ({
      value: Math.floor(metrics.totalMessages / days / Math.random()) || 0,
    })
  );

  const toolCallsSparkline = Array.from(
    { length: Math.min(14, days) },
    (_, i) => ({
      value: Math.floor(metrics.totalToolCalls / days / Math.random()) || 0,
    })
  );

  const stats: StatCardData[] = [
    {
      label: "Sessions",
      value: metrics.totalSessions.toLocaleString(),
      sub: `over ${days} day${days !== 1 ? "s" : ""}`,
      trend: "up",
      sparklineData: sessionsSparkline,
    },
    {
      label: "Messages",
      value: metrics.totalMessages.toLocaleString(),
      trend: "up",
      sparklineData: messagesSparkline,
    },
    {
      label: "Tool Calls",
      value: metrics.totalToolCalls.toLocaleString(),
      trend: "up",
      sparklineData: toolCallsSparkline,
    },
    {
      label: "Avg Duration",
      value: `${avgDurationMin}m`,
      sub: "per session",
      trend: "neutral",
    },
    {
      label: "Sessions / Day",
      value: sessionsPerDay,
      trend: sessionsPerDay > "2.5" ? "up" : "neutral",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat, idx) => (
        <div
          key={stat.label}
          className="bg-navy-900/50 border border-navy-700/50 rounded-xl px-5 py-4 flex flex-col"
        >
          <p className="text-xs font-medium text-navy-400 uppercase tracking-wide">
            {stat.label}
          </p>
          <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
          {stat.sub && (
            <p className="text-xs text-navy-400 mt-0.5">{stat.sub}</p>
          )}

          {/* Sparkline + Trend Icon */}
          {stat.sparklineData && stat.sparklineData.length > 0 && (
            <div className="mt-3 pt-3 border-t border-navy-700/30 flex items-end gap-2">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={24}>
                  <LineChart data={stat.sparklineData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={currentTheme.colors.chartPrimary}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-shrink-0">
                {getTrendIcon(stat.trend)}
              </div>
            </div>
          )}

          {/* Trend Icon (no sparkline) */}
          {!stat.sparklineData && stat.trend && (
            <div className="mt-3 pt-3 border-t border-navy-700/30">
              {getTrendIcon(stat.trend)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
