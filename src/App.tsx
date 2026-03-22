import { useState, useCallback, useEffect, useMemo } from "react";
import type { RawSession, DashboardData } from "@/lib/types";
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
import { ActivityDashboard } from "@/components/ActivityDashboard";
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
import { HighlightReel } from "@/components/HighlightReel";
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
import { PacManGame } from "@/components/PacManGame";

// Upload-first data flow
import { UploadZone } from "@/components/UploadZone";
import {
  mapPayloadToDashboardData,
  mapPayloadToInsightsReport,
} from "@/lib/payload-mapper";
import type { AnalyticsPayloadV2 } from "@/types/payload-v2";


export default function App() {
  const [rawSessions, setRawSessions] = useState<RawSession[]>([]);
  const [insights, setInsights] = useState<InsightsReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Payload-driven state (for uploaded files)
  const [uploadedPayload, setUploadedPayload] =
    useState<AnalyticsPayloadV2 | null>(null);

  // In dev mode, auto-fetch from local API (backward compatible)
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    let cancelled = false;
    setLoading(true);

    async function loadData() {
      try {
        const [sessionsRes, insightsData] = await Promise.all([
          fetch("/api/sessions").then((r) =>
            r.ok
              ? r.json()
              : Promise.reject(new Error(`Sessions: ${r.status}`))
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
          console.warn("Dev auto-fetch failed (expected in production):", err);
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

  // Handle payload upload
  const handlePayloadLoaded = useCallback(
    (payload: AnalyticsPayloadV2) => {
      setUploadedPayload(payload);
      // Clear any raw session data to use payload data instead
      setRawSessions([]);
      setInsights(null);
    },
    []
  );

  // Handle "load different file" — reset to upload state
  const handleReset = useCallback(() => {
    setUploadedPayload(null);
    setRawSessions([]);
    setInsights(null);
    setError(null);
  }, []);

  // Compute dashboard data from whichever source is active
  const dashboardData: DashboardData | null = useMemo(() => {
    if (uploadedPayload) {
      return mapPayloadToDashboardData(uploadedPayload);
    }
    return rawSessions.length > 0 ? buildDashboardData(rawSessions) : null;
  }, [uploadedPayload, rawSessions]);

  // Compute insights from whichever source is active
  const activeInsights: InsightsReport | null = useMemo(() => {
    if (uploadedPayload) {
      return mapPayloadToInsightsReport(uploadedPayload);
    }
    return insights;
  }, [uploadedPayload, insights]);

  // Compute date range
  const sessionDateRange = useMemo(() => {
    if (uploadedPayload) {
      return uploadedPayload.dateRange;
    }
    if (rawSessions.length === 0) return null;
    let min = rawSessions[0].timestamp;
    let max = rawSessions[0].timestamp;
    for (const s of rawSessions) {
      if (s.timestamp < min) min = s.timestamp;
      if (s.timestamp > max) max = s.timestamp;
    }
    return { start: min.slice(0, 10), end: max.slice(0, 10) };
  }, [uploadedPayload, rawSessions]);

  // Dev-only refresh from local API
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessionsRes, insightsData] = await Promise.all([
        fetch("/api/sessions").then((r) =>
          r.ok
            ? r.json()
            : Promise.reject(new Error(`Sessions: ${r.status}`))
        ),
        fetchInsights(),
      ]);
      if (Array.isArray(sessionsRes.sessions)) {
        setRawSessions(sessionsRes.sessions);
      }
      if (insightsData) {
        setInsights(insightsData);
      }
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
    setInsights(null);
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

  // No data loaded — show UploadZone (production) or empty state
  if (!dashboardData) {
    return <UploadZone onPayloadLoaded={handlePayloadLoaded} />;
  }

  const { sessionMetrics } = dashboardData;

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

        {/* Load different file button (when payload is loaded) */}
        {uploadedPayload && (
          <div className="flex justify-end">
            <button
              onClick={handleReset}
              className="text-sm opacity-60 hover:opacity-100 transition-opacity"
            >
              Load different file
            </button>
          </div>
        )}

        {/* Module 1: Header */}
        <Header metrics={sessionMetrics} insights={activeInsights} dateRange={sessionDateRange} onRefresh={import.meta.env.DEV ? handleRefresh : undefined} onClear={handleClear} />

      {/* Module 2: At a Glance */}
      {activeInsights && (
        <section id="at-a-glance">
          <SectionHeading title="At a Glance" />
          <AtAGlance insights={activeInsights} />
        </section>
      )}

      {/* Module 2b: Moments of Discovery */}
      <section>
        <SectionHeading
          title="Moments of Discovery"
          intro="Sessions where Claude made a real difference."
        />
        <HighlightReel />
      </section>

      {/* Module 3: Navigation */}
      <NavTOC />

      {/* Module 4: Stats */}
      <section id="stats">
        <SectionHeading
          title="Key Metrics"
          intro="High-level numbers from your Claude Code sessions."
        />
        <MetricsWithSparklines metrics={sessionMetrics} dailyMetrics={dashboardData.dailyMetrics} />
      </section>

      {/* Module 4b: Activity Dashboard (combined timeline + heatmap) */}
      <section>
        <SectionHeading
          title="Usage Over Time"
          intro="Daily activity trends and heatmap across your sessions."
        />
        <ActivityDashboard data={dashboardData.dailyMetrics} />
      </section>

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
      {activeInsights && (
        <section id="usage">
          <SectionHeading
            title="Usage Story"
            intro="A narrative view of how you've been using Claude Code."
          />
          <UsageNarrative insights={activeInsights} />
        </section>
      )}

      {/* Module 8b: Project Areas */}
      {activeInsights && (
        <section>
          <SectionHeading
            title="Project Areas"
            intro="Where you've been spending your time."
          />
          <ProjectAreas insights={activeInsights} />
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
      {activeInsights && <MultiClauding insights={activeInsights} />}

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
      {activeInsights && (
        <section id="wins">
          <SectionHeading
            title="Big Wins"
            intro="Notable accomplishments from your sessions."
          />
          <BigWins insights={activeInsights} />
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
      {activeInsights && (
        <section id="friction">
          <SectionHeading
            title="Friction Points"
            intro="Where things got stuck and what caused it."
          />
          <FrictionDeep insights={activeInsights} />
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
      {activeInsights && (
        <section id="recommendations">
          <SectionHeading
            title="Recommendations"
            intro="CLAUDE.md improvements and feature suggestions."
          />
          <FeatureSuggestions insights={activeInsights} />
        </section>
      )}

      {/* Module 18: Usage Patterns */}
      {activeInsights && (
        <section>
          <SectionHeading
            title="Usage Patterns"
            intro="Recurring patterns in how you work with Claude."
          />
          <UsagePatterns insights={activeInsights} />
        </section>
      )}

      {/* Module 19: On the Horizon */}
      {activeInsights && (
        <section id="horizon">
          <SectionHeading
            title="On the Horizon"
            intro="Ideas for what to try next."
          />
          <OnTheHorizon insights={activeInsights} />
        </section>
      )}

      {/* Module 20: Fun Ending */}
      {activeInsights && <FunEnding insights={activeInsights} />}

      {/* Module 21: Retro Games (retro theme only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PongGame />
        <PacManGame />
      </div>
      </DashboardShell>
    </>
  );
}
