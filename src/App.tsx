import { useState, useCallback, useEffect, ReactNode } from "react";
import type { RawSession, DateRange, DashboardData } from "@/lib/types";
import type { InsightsReport } from "@/lib/insights-types";
import { buildDashboardData } from "@/lib/dashboard-data";
import { fetchInsights } from "@/lib/insights-loader";

// Layout & navigation
import { DashboardShell } from "@/components/DashboardShell";
import { Header } from "@/components/Header";
import { AtAGlance } from "@/components/AtAGlance";
import { NavTOC } from "@/components/NavTOC";
import { SectionHeading } from "@/components/SectionHeading";
import { ChartsGrid } from "@/components/ChartsGrid";

// Theme background effects
import { NightSky } from "@/components/NightSky";
import { SunriseGlow } from "@/components/SunriseGlow";
import { RetroEffects } from "@/components/RetroEffects";
import { MetricsWithSparklines } from "@/components/MetricsWithSparklines";
import { ProjectAreas } from "@/components/ProjectAreas";

// Charts
import { WantedChart } from "@/components/WantedChart";
import { TopToolsChart } from "@/components/TopToolsChart";
import { LanguagesChart } from "@/components/LanguagesChart";
import { SessionTypesChart } from "@/components/SessionTypesChart";
import { ResponseTimeChart } from "@/components/ResponseTimeChart";
import { TimeOfDayChart } from "@/components/TimeOfDayChart";
import { ToolErrorsChart } from "@/components/ToolErrorsChart";
import { HelpfulChart } from "@/components/HelpfulChart";
import { OutcomesChart } from "@/components/OutcomesChart";
import { FrictionTypesChart } from "@/components/FrictionTypesChart";
import { InferredSatisfactionChart } from "@/components/InferredSatisfactionChart";

// Narrative & qualitative
import { UsageNarrative } from "@/components/UsageNarrative";
import { MultiClauding } from "@/components/MultiClauding";
import { BigWins } from "@/components/BigWins";
import { FrictionDeep } from "@/components/FrictionDeep";

// Recommendations
import { FeatureSuggestions } from "@/components/FeatureSuggestions";
import { UsagePatterns } from "@/components/UsagePatterns";
import { OnTheHorizon } from "@/components/OnTheHorizon";
import { FunEnding } from "@/components/FunEnding";
import { PongGame } from "@/components/PongGame";

// Controls
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { FileUpload } from "@/components/FileUpload";
import { FolderPicker } from "@/components/FolderPicker";

export default function App() {
  const [rawSessions, setRawSessions] = useState<RawSession[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: null,
    end: null,
  });
  const [insights, setInsights] = useState<InsightsReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-fetch sessions + insights on mount
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [sessionsRes, insightsData] = await Promise.all([
          fetch("/api/sessions").then((r) =>
            r.ok ? r.json() : Promise.reject(new Error(`Sessions: ${r.status}`))
          ),
          fetchInsights(),
        ]);
        if (!cancelled) {
          if (Array.isArray(sessionsRes.sessions)) {
            setRawSessions(sessionsRes.sessions);
          }
          if (insightsData) {
            setInsights(insightsData);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("Auto-fetch failed, falling back to manual upload:", err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const dashboardData: DashboardData | null =
    rawSessions.length > 0 ? buildDashboardData(rawSessions, dateRange) : null;

  const handleFilesLoaded = useCallback((sessions: RawSession[]) => {
    setRawSessions((prev) => [...prev, ...sessions]);
    setError(null);
  }, []);

  const handleParseError = useCallback((msg: string) => {
    setError(msg);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsRes, insightsData] = await Promise.all([
        fetch("/api/sessions").then((r) =>
          r.ok ? r.json() : Promise.reject(new Error(`Sessions: ${r.status}`))
        ),
        fetchInsights(),
      ]);
      if (Array.isArray(sessionsRes.sessions)) {
        setRawSessions(sessionsRes.sessions);
      }
      if (insightsData) {
        setInsights(insightsData);
      }
      setError(null);
    } catch (err) {
      setError(
        `Refresh failed: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    setRawSessions([]);
    setDateRange({ start: null, end: null });
    setError(null);
  }, []);

  const handleReplace = useCallback((sessions: RawSession[]) => {
    setRawSessions(sessions);
    setError(null);
  }, []);

  // Loading state
  if (loading) {
    return (
      <>
        <NightSky />
        <SunriseGlow />
        <RetroEffects />
        <DashboardShell>
          <div className="flex items-center justify-center py-32">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto" />
              <p className="text-navy-400 text-sm">
                Scanning Claude Code sessions…
              </p>
            </div>
          </div>
        </DashboardShell>
      </>
    );
  }

  // Empty state — no sessions loaded
  if (!dashboardData) {
    return (
      <>
        <NightSky />
        <SunriseGlow />
        <RetroEffects />
        <DashboardShell>
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300 max-w-md">
                {error}
              </div>
            )}
            <div className="w-12 h-12 rounded-xl bg-navy-800 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-navy-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <p className="text-navy-300 text-base">
              No sessions found in the last 30 days
            </p>
            <p className="text-navy-500 text-sm">
              Drop a Claude Code session export below to get started
            </p>
            <FileUpload onLoaded={handleFilesLoaded} onError={handleParseError} />
            <div className="flex items-center gap-3 text-navy-500 text-sm">
              <span>or</span>
            </div>
            <FolderPicker
              onLoaded={handleFilesLoaded}
              onError={handleParseError}
              onReplace={handleReplace}
            />
          </div>
        </DashboardShell>
      </>
    );
  }

  const { sessionMetrics } = dashboardData;

  // Prepare controls elements to pass to Header
  const filterControls = (
    <>
      <DateRangeFilter value={dateRange} onChange={setDateRange} />
      <FileUpload onLoaded={handleFilesLoaded} onError={handleParseError} compact />
      <FolderPicker
        onLoaded={handleFilesLoaded}
        onError={handleParseError}
        onReplace={handleReplace}
      />
    </>
  );
  const actionControls = (
    <>
      <button
        onClick={handleRefresh}
        className="text-xs text-navy-400 hover:text-navy-200 transition-colors"
      >
        Refresh
      </button>
      <button
        onClick={handleClear}
        className="text-xs text-navy-400 hover:text-navy-200 transition-colors"
      >
        Clear
      </button>
    </>
  );

  return (
    <>
      <NightSky />
      <SunriseGlow />
      <RetroEffects />
      <DashboardShell>
        {/* Error banner */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Module 1: Header */}
        <Header metrics={sessionMetrics} insights={insights} filterControls={filterControls} actionControls={actionControls} />

      {/* Module 2: At a Glance */}
      {insights && (
        <section id="at-a-glance">
          <SectionHeading title="At a Glance" />
          <AtAGlance insights={insights} />
        </section>
      )}

      {/* Module 3: Navigation */}
      <NavTOC />

      {/* Module 4: Stats */}
      <section id="stats">
        <SectionHeading
          title="Key Metrics"
          intro="High-level numbers from your Claude Code sessions."
        />
        <MetricsWithSparklines metrics={sessionMetrics} />
      </section>

      {/* Module 5: Project Areas */}
      {insights && (
        <section>
          <SectionHeading
            title="Project Areas"
            intro="Where you've been spending your time."
          />
          <ProjectAreas insights={insights} />
        </section>
      )}

      {/* Modules 6-7: Charts */}
      <section id="charts">
        <SectionHeading
          title="Activity Breakdown"
          intro="What you worked on and how Claude helped."
        />
        <div className="space-y-6">
          <ChartsGrid>
            <WantedChart data={dashboardData.goalDistribution} />
            <TopToolsChart data={dashboardData.toolUsageStats} />
          </ChartsGrid>
          <ChartsGrid>
            <LanguagesChart data={dashboardData.languageStats} />
            <SessionTypesChart data={dashboardData.sessionTypeStats} />
          </ChartsGrid>
        </div>
      </section>

      {/* Module 8: Usage Narrative */}
      {insights && (
        <section id="usage">
          <SectionHeading
            title="Usage Story"
            intro="A narrative view of how you've been using Claude Code."
          />
          <UsageNarrative insights={insights} />
        </section>
      )}

      {/* Module 9: Response Time */}
      <section>
        <SectionHeading
          title="Response Timing"
          intro="How quickly you respond between messages."
        />
        <ResponseTimeChart data={dashboardData.responseTimeBuckets} />
      </section>

      {/* Module 10: Multi-Clauding */}
      {insights && <MultiClauding insights={insights} />}

      {/* Module 11: Time of Day + Tool Errors */}
      <section>
        <SectionHeading
          title="Patterns & Errors"
          intro="When you work and what goes wrong."
        />
        <ChartsGrid>
          <TimeOfDayChart data={dashboardData.timeOfDayBuckets} />
          <ToolErrorsChart data={dashboardData.toolErrorStats} />
        </ChartsGrid>
      </section>

      {/* Module 12: Big Wins */}
      {insights && (
        <section id="wins">
          <SectionHeading
            title="Big Wins"
            intro="Notable accomplishments from your sessions."
          />
          <BigWins insights={insights} />
        </section>
      )}

      {/* Module 13: Helpful Factors + Outcomes */}
      <section>
        <SectionHeading
          title="Results"
          intro="What helped and how sessions turned out."
        />
        <ChartsGrid>
          <HelpfulChart data={dashboardData.helpfulFactorStats} />
          <OutcomesChart data={dashboardData.outcomeStats} />
        </ChartsGrid>
      </section>

      {/* Module 14: Friction Deep Dive */}
      {insights && (
        <section id="friction">
          <SectionHeading
            title="Friction Points"
            intro="Where things got stuck and what caused it."
          />
          <FrictionDeep insights={insights} />
        </section>
      )}

      {/* Module 15: Friction Types + Satisfaction */}
      <section>
        <SectionHeading
          title="Friction & Satisfaction"
          intro="Categorized friction and inferred satisfaction levels."
        />
        <ChartsGrid>
          <FrictionTypesChart data={dashboardData.frictionTypeStats} />
          <InferredSatisfactionChart
            data={dashboardData.inferredSatisfaction}
          />
        </ChartsGrid>
      </section>

      {/* Modules 16-17: Feature Suggestions */}
      {insights && (
        <section id="recommendations">
          <SectionHeading
            title="Recommendations"
            intro="CLAUDE.md improvements and feature suggestions."
          />
          <FeatureSuggestions insights={insights} />
        </section>
      )}

      {/* Module 18: Usage Patterns */}
      {insights && (
        <section>
          <SectionHeading
            title="Usage Patterns"
            intro="Recurring patterns in how you work with Claude."
          />
          <UsagePatterns insights={insights} />
        </section>
      )}

      {/* Module 19: On the Horizon */}
      {insights && (
        <section id="horizon">
          <SectionHeading
            title="On the Horizon"
            intro="Ideas for what to try next."
          />
          <OnTheHorizon insights={insights} />
        </section>
      )}

      {/* Module 20: Fun Ending */}
      {insights && <FunEnding insights={insights} />}

      {/* Module 21: Retro Pong (retro theme only) */}
      <PongGame />
      </DashboardShell>
    </>
  );
}
