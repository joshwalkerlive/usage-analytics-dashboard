import type { InsightsReport } from "@/lib/insights-types";
import { useTheme } from "@/context/ThemeContext";

interface AtAGlanceProps {
  insights: InsightsReport;
}

interface QuadrantProps {
  title: string;
  items: string[];
  accent: string;
  icon: React.ReactNode;
}

function Quadrant({ title, items, accent, icon }: QuadrantProps) {
  if (items.length === 0) return null;

  return (
    <div className="bg-navy-900/50 border border-navy-700/50 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${accent}`}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-navy-200 leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AtAGlance({ insights }: AtAGlanceProps) {
  const { theme } = useTheme();
  const { atAGlance } = insights;
  const isRetro = theme === "retro";
  const lc = (isRetro ? "square" : "round") as "square" | "round";
  const lj = (isRetro ? "miter" : "round") as "miter" | "round";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Quadrant
          title={isRetro ? "ACTIVE BOOSTS" : "What's Working"}
          items={atAGlance.working}
          accent="bg-emerald-500/20 text-emerald-400"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap={lc} strokeLinejoin={lj} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <Quadrant
          title={isRetro ? "OBSTACLES" : "What's Hindering"}
          items={atAGlance.hindering}
          accent="bg-rose-500/20 text-rose-400"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap={lc} strokeLinejoin={lj} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <Quadrant
          title={isRetro ? "POWER UPS" : "Quick Wins"}
          items={atAGlance.quickWins}
          accent="bg-amber-500/20 text-amber-400"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap={lc} strokeLinejoin={lj} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <Quadrant
          title={isRetro ? "SIDE QUESTS" : "Ambitious Goals"}
          items={atAGlance.ambitious}
          accent="bg-violet-500/20 text-violet-400"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap={lc} strokeLinejoin={lj} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
    </div>
  );
}
