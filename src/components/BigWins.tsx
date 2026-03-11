import type { InsightsReport } from "@/lib/insights-types";

interface BigWinsProps {
  insights: InsightsReport;
}

const WIN_ICONS = [
  // Trophy
  <svg key="trophy" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5A3.375 3.375 0 0019.875 10.875 3.375 3.375 0 0016.5 7.5h0V1.5h-9v6h0A3.375 3.375 0 004.125 10.875 3.375 3.375 0 007.5 14.25v4.5" />
  </svg>,
  // Star
  <svg key="star" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>,
  // Rocket
  <svg key="rocket" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>,
];

const WIN_ACCENTS = [
  "border-t-emerald-400",
  "border-t-accent",
  "border-t-sky-400",
  "border-t-violet-400",
  "border-t-pink-400",
];

export function BigWins({ insights }: BigWinsProps) {
  const wins = insights.bigWins;

  if (!wins || wins.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {wins.map((win, index) => (
        <div
          key={index}
          className={`bg-navy-900/50 border border-navy-700/50 border-t-2 ${
            WIN_ACCENTS[index % WIN_ACCENTS.length]
          } rounded-xl p-5`}
        >
          <div className="flex items-start gap-3 mb-3">
            <span className="text-emerald-400 mt-0.5 shrink-0">
              {WIN_ICONS[index % WIN_ICONS.length]}
            </span>
            <h3 className="text-sm font-semibold text-navy-100 leading-snug">
              {win.title}
            </h3>
          </div>
          <p className="text-xs text-navy-300 leading-relaxed">
            {win.description}
          </p>
        </div>
      ))}
    </div>
  );
}
