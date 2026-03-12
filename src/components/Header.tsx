import { ReactNode, useState, useEffect } from "react";
import type { SessionMetrics } from "@/lib/types";
import type { InsightsReport } from "@/lib/insights-types";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useTheme } from "@/context/ThemeContext";

interface HeaderProps {
  metrics: SessionMetrics;
  insights: InsightsReport | null;
  filterControls?: ReactNode;
  actionControls?: ReactNode;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
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

export function Header({ metrics, insights, filterControls, actionControls }: HeaderProps) {
  const { currentTheme } = useTheme();
  const dateRange = insights?.dateRange;
  const dateLabel = dateRange
    ? `${formatDate(dateRange.start)} – ${formatDate(dateRange.end)}`
    : null;

  const bgPrimary = currentTheme.colors.bg.primary;

  return (
    <header className="space-y-0">
      {/* Sticky nav bar with conditional theme selector reveal */}
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
              Claude Code Usage Report
            </h1>
          </div>

          {/* Center: theme selector */}
          <div className="flex justify-center flex-1">
            <ThemeSelector />
          </div>
        </div>
      </div>

      {/* Row 1: metrics left, right-side hierarchy (date label → filter controls → action controls) */}
      <div className="flex items-start justify-between gap-4 pt-3">
        <div className="flex items-center gap-4 text-sm text-navy-300">
          <span>{metrics.totalSessions} sessions analyzed</span>
          <span className="text-navy-600">·</span>
          <span>{metrics.totalMessages.toLocaleString()} messages</span>
          <span className="text-navy-600">·</span>
          <span>{metrics.totalToolCalls.toLocaleString()} tool calls</span>
        </div>

        {/* Right side: hierarchical column (date label → filter controls → action controls) */}
        <div className="flex flex-col items-end gap-2">
          {dateLabel && (
            <span className="text-navy-400 text-xs whitespace-nowrap">
              {dateLabel}
            </span>
          )}
          {filterControls && (
            <div className="flex items-center gap-3 flex-wrap justify-end">
              {filterControls}
            </div>
          )}
          {actionControls && (
            <div className="flex items-center gap-3 flex-wrap justify-end pt-1">
              {actionControls}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
