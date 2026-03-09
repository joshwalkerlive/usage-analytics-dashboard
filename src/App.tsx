import { useState, useCallback } from "react";
import type { RawSession, DateRange, DashboardData } from "@/lib/types";
import { parseSessionExport } from "@/lib/parser";
import { buildDashboardData } from "@/lib/dashboard-data";
import { MetricsCards } from "@/components/MetricsCards";
import { ToolUsageChart } from "@/components/ToolUsageChart";
import { GoalDistributionChart } from "@/components/GoalDistributionChart";
import { FrictionChart } from "@/components/FrictionChart";
import { SatisfactionChart } from "@/components/SatisfactionChart";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { FileUpload } from "@/components/FileUpload";

export default function App() {
  const [rawSessions, setRawSessions] = useState<RawSession[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: null,
    end: null,
  });
  const [error, setError] = useState<string | null>(null);

  const dashboardData: DashboardData | null =
    rawSessions.length > 0 ? buildDashboardData(rawSessions, dateRange) : null;

  const handleFilesLoaded = useCallback((sessions: RawSession[]) => {
    setRawSessions((prev) => [...prev, ...sessions]);
    setError(null);
  }, []);

  const handleParseError = useCallback((msg: string) => {
    setError(msg);
  }, []);

  const handleClear = useCallback(() => {
    setRawSessions([]);
    setDateRange({ start: null, end: null });
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">
            Claude Code Usage Insights
          </h1>
          {rawSessions.length > 0 && (
            <button
              onClick={handleClear}
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              Clear Data
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!dashboardData ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <p className="text-gray-400 text-lg">
              Drop a Claude Code session export to get started
            </p>
            <FileUpload
              onLoaded={handleFilesLoaded}
              onError={handleParseError}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <DateRangeFilter value={dateRange} onChange={setDateRange} />
              <FileUpload
                onLoaded={handleFilesLoaded}
                onError={handleParseError}
                compact
              />
            </div>

            <MetricsCards metrics={dashboardData.sessionMetrics} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ToolUsageChart data={dashboardData.toolUsageStats} />
              <GoalDistributionChart data={dashboardData.goalDistribution} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FrictionChart data={dashboardData.frictionOverTime} />
              <SatisfactionChart
                data={dashboardData.satisfactionDistribution}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
