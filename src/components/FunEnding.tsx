import type { InsightsReport } from "@/lib/insights-types";

interface FunEndingProps {
  insights: InsightsReport;
}

export function FunEnding({ insights }: FunEndingProps) {
  const ending = insights.funEnding;

  if (!ending) return null;

  return (
    <div className="bg-navy-900/50 border border-navy-700/50 rounded-xl p-6 text-center">
      <div className="max-w-lg mx-auto">
        <h3 className="text-base font-semibold text-navy-100 mb-2">
          {ending.headline}
        </h3>
        <p className="text-sm text-navy-300 leading-relaxed">
          {ending.detail}
        </p>
      </div>
    </div>
  );
}
