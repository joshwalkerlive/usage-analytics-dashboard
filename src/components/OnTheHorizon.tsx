import type { InsightsReport } from "@/lib/insights-types";
import { CopyButton } from "./CopyButton";

interface OnTheHorizonProps {
  insights: InsightsReport;
}

const HORIZON_ICONS = [
  // Lightbulb
  <svg
    key="lightbulb"
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
    />
  </svg>,
  // Compass
  <svg
    key="compass"
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
    />
  </svg>,
  // Beaker
  <svg
    key="beaker"
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
    />
  </svg>,
];

const HORIZON_ACCENTS = [
  "border-l-sky-400",
  "border-l-violet-400",
  "border-l-amber-400",
  "border-l-emerald-400",
  "border-l-pink-400",
];

export function OnTheHorizon({ insights }: OnTheHorizonProps) {
  const ideas = insights.horizonIdeas;

  if (!ideas || ideas.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {ideas.map((idea, index) => (
        <div
          key={index}
          className={`bg-navy-900/50 border border-navy-700/50 border-l-4 ${
            HORIZON_ACCENTS[index % HORIZON_ACCENTS.length]
          } rounded-xl p-5 flex flex-col`}
        >
          <div className="flex items-start gap-3 mb-3">
            <span className="text-sky-400 mt-0.5 shrink-0">
              {HORIZON_ICONS[index % HORIZON_ICONS.length]}
            </span>
            <h3 className="text-sm font-semibold text-navy-100 leading-snug">
              {idea.title}
            </h3>
          </div>

          <p className="text-xs text-navy-300 leading-relaxed mb-2">
            {idea.possible}
          </p>

          {idea.tip && (
            <p className="text-xs text-accent/80 leading-relaxed mb-3 italic">
              Tip: {idea.tip}
            </p>
          )}

          <div className="mt-auto pt-3">
            <CopyButton text={idea.prompt} label="Copy prompt" />
          </div>
        </div>
      ))}
    </div>
  );
}
