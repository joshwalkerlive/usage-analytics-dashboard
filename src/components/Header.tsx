import type { SessionMetrics } from "@/lib/types";
import type { InsightsReport } from "@/lib/insights-types";
import { hexToRgba } from "@/lib/chart-utils";
import { useTheme } from "@/context/ThemeContext";

interface HeaderProps {
  metrics: SessionMetrics;
  insights: InsightsReport | null;
  dateRange?: { start: string; end: string } | null;
  onRefresh?: () => void;
  onClear?: () => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function Header({ metrics, insights, dateRange, onRefresh, onClear }: HeaderProps) {
  const { currentTheme } = useTheme();
  const dateLabel = dateRange
    ? `${formatDate(dateRange.start)} – ${formatDate(dateRange.end)}`
    : null;

  const bgPrimary = currentTheme.colors.bg.primary;
  const accent = currentTheme.colors.accent;

  const statPills = [
    { label: "Sessions", value: metrics.totalSessions.toLocaleString(), color: "#818cf8" },
    { label: "Messages", value: metrics.totalMessages.toLocaleString(), color: "#34d399" },
    { label: "Tool Calls", value: metrics.totalToolCalls.toLocaleString(), color: "#fbbf24" },
  ];

  return (
    <header className="space-y-0">
      {/* Sticky header bar */}
      <div
        className="sticky top-0 z-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3"
        style={{
          backgroundColor: hexToRgba(bgPrimary, 0),
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left: icon + title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-navy-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight leading-tight">
              Claude Insights Cockpit
            </h1>
          </div>

          {/* Right: stat pills */}
          <div className="flex items-center gap-2">
            {statPills.map((pill) => (
              <div
                key={pill.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
                style={{
                  backgroundColor: hexToRgba(pill.color, 0.12),
                  border: `1px solid ${hexToRgba(pill.color, 0.25)}`,
                }}
              >
                <span style={{ color: hexToRgba(pill.color, 0.7) }} className="font-medium">{pill.label}</span>
                <span className="text-white font-bold">{pill.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: date range + actions */}
      <div className="flex items-center justify-end gap-4 pt-3">
        {dateLabel && (
          <span className="text-navy-400 text-xs whitespace-nowrap">
            {dateLabel}
          </span>
        )}
        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-xs text-navy-400 hover:text-navy-200 transition-colors"
            >
              Refresh
            </button>
          )}
          {onClear && (
            <button
              onClick={onClear}
              className="text-xs text-navy-400 hover:text-navy-200 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
