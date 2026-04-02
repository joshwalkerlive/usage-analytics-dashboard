import { useState } from "react";
import type { InsightsReport } from "@/lib/insights-types";
import { CopyButton } from "./CopyButton";

interface FeatureSuggestionsProps {
  insights: InsightsReport;
}

export function FeatureSuggestions({ insights }: FeatureSuggestionsProps) {
  const suggestions = insights.claudeMdSuggestions;
  const features = insights.featureRecommendations;
  const tips = insights.workflowTips;
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const hasSuggestions = suggestions && suggestions.length > 0;
  const hasFeatures = features && features.length > 0;
  const hasTips = tips && tips.length > 0;

  if (!hasSuggestions && !hasFeatures && !hasTips) return null;

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const checkedTexts = suggestions
    .filter((s) => checked.has(s.id))
    .map((s) => s.text);

  return (
    <div className="space-y-6">
      {/* CLAUDE.md Suggestions */}
      {hasSuggestions && (
        <div className="bg-navy-900/50 border border-navy-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-navy-100">
              CLAUDE.md Suggestions
            </h3>
            {checkedTexts.length > 0 && (
              <CopyButton
                text={checkedTexts.join("\n\n")}
                label={`Copy ${checkedTexts.length} selected`}
              />
            )}
          </div>

          <ul className="space-y-3">
            {suggestions.map((suggestion) => (
              <li key={suggestion.id} className="flex items-start gap-3">
                <button
                  onClick={() => toggleCheck(suggestion.id)}
                  className={`mt-0.5 shrink-0 w-4 h-4 rounded border transition-colors ${
                    checked.has(suggestion.id)
                      ? "bg-accent border-accent"
                      : "border-navy-500 hover:border-navy-300"
                  }`}
                  aria-label={
                    checked.has(suggestion.id) ? "Uncheck" : "Check"
                  }
                >
                  {checked.has(suggestion.id) && (
                    <svg
                      className="w-4 h-4 text-navy-900"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
                <span
                  className={`text-sm leading-relaxed ${
                    checked.has(suggestion.id)
                      ? "text-navy-400 line-through"
                      : "text-navy-200"
                  }`}
                >
                  {suggestion.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feature Recommendations */}
      {hasFeatures && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-navy-900/50 border border-navy-700/50 rounded-xl p-5"
            >
              <div className="flex items-start gap-3 mb-2">
                <span className="text-accent mt-0.5 shrink-0">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                    />
                  </svg>
                </span>
                <h4 className="text-sm font-semibold text-navy-100 leading-snug">
                  {feature.title}
                </h4>
              </div>
              <p className="text-xs text-navy-300 leading-relaxed mb-3">
                {feature.description}
              </p>
              {feature.code && (
                <div className="relative">
                  <pre className="bg-navy-950 border border-navy-700 rounded-lg p-3 text-xs text-navy-200 overflow-x-auto font-mono leading-relaxed">
                    {feature.code}
                  </pre>
                  <div className="absolute top-2 right-2">
                    <CopyButton text={feature.code} label="Copy" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Workflow Tips */}
      {hasTips && (
        <div className="bg-navy-900/50 border border-navy-700/50 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-navy-100 mb-4">
            Workflow Tips
          </h3>
          <ul className="space-y-3">
            {tips.map((tip, index) => (
              <li
                key={index}
                className="flex items-start gap-3"
              >
                <span className="text-accent mt-0.5 shrink-0">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                    />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-navy-200 leading-relaxed">
                    {tip.text}
                  </p>
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-xs text-navy-400">
                      Priority: {tip.priority}
                    </span>
                    <span className="text-xs text-navy-400">
                      Effort: {tip.effort}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
