import type { SessionMetrics } from "@/lib/types";

interface StatsRowProps {
  metrics: SessionMetrics;
}

interface StatCardData {
  label: string;
  value: string;
  sub?: string;
}

export function StatsRow({ metrics }: StatsRowProps) {
  const avgDurationMin = Math.round(metrics.avgDurationMs / 60_000);
  const days = Object.keys(metrics.sessionsPerDay).length;
  const sessionsPerDay = days > 0 ? (metrics.totalSessions / days).toFixed(1) : "0";

  const stats: StatCardData[] = [
    {
      label: "Sessions",
      value: metrics.totalSessions.toLocaleString(),
      sub: `over ${days} day${days !== 1 ? "s" : ""}`,
    },
    {
      label: "Messages",
      value: metrics.totalMessages.toLocaleString(),
    },
    {
      label: "Tool Calls",
      value: metrics.totalToolCalls.toLocaleString(),
    },
    {
      label: "Avg Duration",
      value: `${avgDurationMin}m`,
      sub: "per session",
    },
    {
      label: "Sessions / Day",
      value: sessionsPerDay,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-navy-900/50 border border-navy-700/50 rounded-xl px-5 py-4"
        >
          <p className="text-xs font-medium text-navy-400 uppercase tracking-wide">
            {stat.label}
          </p>
          <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
          {stat.sub && (
            <p className="text-xs text-navy-400 mt-0.5">{stat.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
