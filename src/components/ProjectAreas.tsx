import type { InsightsReport } from "@/lib/insights-types";

interface ProjectAreasProps {
  insights: InsightsReport;
}

const AREA_ACCENTS = [
  "border-l-indigo-400",
  "border-l-accent",
  "border-l-emerald-400",
  "border-l-pink-400",
  "border-l-sky-400",
  "border-l-violet-400",
  "border-l-orange-400",
  "border-l-amber-400",
];

export function ProjectAreas({ insights }: ProjectAreasProps) {
  const areas = insights.projectAreas;

  if (!areas || areas.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {areas.map((area, index) => (
        <div
          key={index}
          className={`bg-navy-900/50 border border-navy-700/50 border-l-4 ${
            AREA_ACCENTS[index % AREA_ACCENTS.length]
          } rounded-xl p-5`}
        >
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-sm font-semibold text-navy-100 truncate mr-2">
              {area.name}
            </h3>
            <span className="text-xs text-navy-400 whitespace-nowrap">
              {area.sessionCount} session{area.sessionCount !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-xs text-navy-300 leading-relaxed line-clamp-3">
            {area.description}
          </p>
        </div>
      ))}
    </div>
  );
}
