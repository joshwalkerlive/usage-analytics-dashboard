import type { InsightsReport } from "@/lib/insights-types";

interface MultiClaudingProps {
  insights: InsightsReport;
}

export function MultiClauding({ insights }: MultiClaudingProps) {
  const multi = insights.multiClauding;

  if (!multi) return null;

  return (
    <div className="bg-navy-900/50 border border-navy-700/50 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            multi.detected ? "bg-accent" : "bg-navy-600"
          }`}
        />
        <h3 className="text-sm font-semibold text-navy-100">
          Parallel Claude Usage
        </h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            multi.detected
              ? "bg-accent/10 text-accent"
              : "bg-navy-800 text-navy-400"
          }`}
        >
          {multi.detected ? "Detected" : "Not detected"}
        </span>
      </div>
      <p className="text-xs text-navy-300 leading-relaxed">
        {multi.details}
      </p>
    </div>
  );
}
