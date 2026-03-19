import { useState } from "react";
import type { InsightsReport } from "@/lib/insights-types";
import { CopyButton } from "./CopyButton";

interface UsagePatternsProps {
  insights: InsightsReport;
}

const PATTERN_ACCENTS = [
  "border-t-sky-400",
  "border-t-violet-400",
  "border-t-amber-400",
  "border-t-emerald-400",
  "border-t-pink-400",
];

export function UsagePatterns({ insights }: UsagePatternsProps) {
  const patterns = insights.usagePatterns;

  if (!patterns || patterns.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {patterns.map((pattern, index) => (
        <PatternCard
          key={index}
          pattern={pattern}
          accent={PATTERN_ACCENTS[index % PATTERN_ACCENTS.length]}
        />
      ))}
      </div>
    </div>
  );
}

function PatternCard({
  pattern,
  accent,
}: {
  pattern: { title: string; summary: string; detail: string; prompt: string };
  accent: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`bg-navy-900/50 border border-navy-700/50 border-t-2 ${accent} rounded-xl p-5 flex flex-col`}
    >
      <h3 className="text-sm font-semibold text-navy-100 mb-2">
        {pattern.title}
      </h3>
      <p className="text-xs text-navy-300 leading-relaxed mb-3">
        {pattern.summary}
      </p>

      {pattern.detail && (
        <div className="mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 text-xs text-navy-400 hover:text-navy-200 transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
            {expanded ? "Hide" : "Show"} details
          </button>
          {expanded && (
            <p className="mt-2 text-xs text-navy-400 leading-relaxed pl-4 border-l border-navy-700">
              {pattern.detail}
            </p>
          )}
        </div>
      )}

      <div className="mt-auto pt-3">
        <CopyButton text={pattern.prompt} label="Copy prompt" />
      </div>
    </div>
  );
}
