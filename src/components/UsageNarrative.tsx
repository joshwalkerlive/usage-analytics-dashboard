import type { InsightsReport } from "@/lib/insights-types";

interface UsageNarrativeProps {
  insights: InsightsReport;
}

export function UsageNarrative({ insights }: UsageNarrativeProps) {
  const narrative = insights.usageNarrative;

  if (!narrative || narrative.paragraphs.length === 0) return null;

  return (
    <div className="bg-navy-900/50 border border-navy-700/50 rounded-xl p-6">
      <div className="space-y-4">
        {narrative.paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className="text-sm text-navy-200 leading-relaxed"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {narrative.keyInsight && (
        <div className="mt-6 border-l-2 border-accent pl-4 py-1">
          <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">
            Key Insight
          </p>
          <p className="text-sm text-navy-100 leading-relaxed">
            {narrative.keyInsight}
          </p>
        </div>
      )}
    </div>
  );
}
