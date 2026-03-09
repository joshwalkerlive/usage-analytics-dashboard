import type { SessionMetrics } from "@/lib/types";

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h ${remaining}m`;
}

interface MetricsCardsProps {
  metrics: SessionMetrics;
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    { label: "Total Sessions", value: metrics.totalSessions },
    { label: "Avg Duration", value: formatDuration(metrics.avgDurationMs) },
    { label: "Total Messages", value: metrics.totalMessages },
    { label: "Total Tool Calls", value: metrics.totalToolCalls },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-gray-900 border border-gray-800 rounded-xl p-5"
        >
          <p className="text-sm text-gray-400">{card.label}</p>
          <p className="text-2xl font-semibold text-gray-100 mt-1">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
