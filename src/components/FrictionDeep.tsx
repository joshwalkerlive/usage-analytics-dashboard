import { useState } from "react";
import type { InsightsReport } from "@/lib/insights-types";

interface FrictionDeepProps {
  insights: InsightsReport;
}

const FRICTION_ACCENTS = [
  "border-l-red-400",
  "border-l-orange-400",
  "border-l-amber-400",
  "border-l-violet-400",
  "border-l-indigo-400",
  "border-l-pink-400",
];

function FrictionCard({
  title,
  description,
  examples,
  accent,
}: {
  title: string;
  description: string;
  examples: string[];
  accent: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`bg-navy-900/50 border border-navy-700/50 border-l-4 ${accent} rounded-xl p-5`}
    >
      <h3 className="text-sm font-semibold text-navy-100 mb-2">{title}</h3>
      <p className="text-xs text-navy-300 leading-relaxed mb-3">
        {description}
      </p>

      {examples.length > 0 && (
        <div>
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
            {expanded ? "Hide" : "Show"} {examples.length} example
            {examples.length !== 1 ? "s" : ""}
          </button>

          {expanded && (
            <ul className="mt-3 space-y-2">
              {examples.map((example, i) => (
                <li
                  key={i}
                  className="text-xs text-navy-400 pl-4 border-l border-navy-700 leading-relaxed"
                >
                  {example}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function FrictionDeep({ insights }: FrictionDeepProps) {
  const categories = insights.frictionCategories;

  if (!categories || categories.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((cat, index) => (
        <FrictionCard
          key={index}
          title={cat.title}
          description={cat.description}
          examples={cat.examples}
          accent={FRICTION_ACCENTS[index % FRICTION_ACCENTS.length]}
        />
      ))}
    </div>
  );
}
