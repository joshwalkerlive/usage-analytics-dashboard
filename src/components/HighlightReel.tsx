import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Highlight {
  goal: string;
  summary: string;
  success: string;
  helpfulness: string;
}

interface FacetData {
  underlying_goal?: string;
  brief_summary?: string;
  primary_success?: string;
  claude_helpfulness?: string;
  outcome?: string;
}

const SUCCESS_LABELS: Record<string, string> = {
  good_explanations: "Clear Explanations",
  multi_file_changes: "Multi-File Build",
  correct_code_edits: "Precise Code Edits",
  fast_accurate_search: "Fast Research",
  proactive_help: "Proactive Assistance",
  good_debugging: "Effective Debugging",
};

const CATEGORY_ALL = "All";

export function HighlightReel() {
  const { currentTheme } = useTheme();
  const [allHighlights, setAllHighlights] = useState<Highlight[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [activeCategory, setActiveCategory] = useState(CATEGORY_ALL);

  useEffect(() => {
    fetch("/api/facets")
      .then((r) => (r.ok ? r.json() : { facets: [] }))
      .then((data) => {
        const facets = (data.facets as FacetData[]) || [];
        const positive = facets
          .filter(
            (f) =>
              (f.outcome === "fully_achieved" ||
                f.outcome === "mostly_achieved") &&
              (f.claude_helpfulness === "essential" ||
                f.claude_helpfulness === "very_helpful") &&
              f.brief_summary
          )
          .map((f) => ({
            goal: f.underlying_goal || "",
            summary: f.brief_summary || "",
            success: f.primary_success || "none",
            helpfulness: f.claude_helpfulness || "",
          }));

        // Shuffle for variety
        for (let i = positive.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [positive[i], positive[j]] = [positive[j], positive[i]];
        }

        setAllHighlights(positive);
      })
      .catch(() => {});
  }, []);

  // Available categories from the data
  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const h of allHighlights) {
      if (h.success && h.success !== "none") {
        cats.add(SUCCESS_LABELS[h.success] || h.success);
      }
    }
    return [CATEGORY_ALL, ...Array.from(cats).sort()];
  }, [allHighlights]);

  // Filter by active category
  const highlights = useMemo(() => {
    if (activeCategory === CATEGORY_ALL) return allHighlights;
    return allHighlights.filter((h) => {
      const label = SUCCESS_LABELS[h.success] || h.success;
      return label === activeCategory;
    });
  }, [allHighlights, activeCategory]);

  // Reset index when category changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeCategory]);

  const goToNext = useCallback(() => {
    if (highlights.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((i) => (i + 1) % highlights.length);
      setIsTransitioning(false);
    }, 300);
  }, [highlights.length]);

  const goToPrev = useCallback(() => {
    if (highlights.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((i) => (i - 1 + highlights.length) % highlights.length);
      setIsTransitioning(false);
    }, 300);
  }, [highlights.length]);

  // Auto-advance every 8 seconds
  useEffect(() => {
    if (highlights.length <= 1) return;
    const timer = setInterval(goToNext, 8000);
    return () => clearInterval(timer);
  }, [highlights.length, goToNext]);

  if (allHighlights.length === 0) return null;

  const h = highlights[currentIndex] || highlights[0];
  if (!h) return null;

  const successLabel = SUCCESS_LABELS[h.success] || h.success;
  const accent = currentTheme.colors.accent;

  return (
    <div
      className="bg-navy-900/50 border border-navy-700/50 rounded-xl p-8 relative overflow-hidden"
      style={{
        boxShadow: `0 0 20px ${accent}15, 0 0 40px ${accent}08`,
        minHeight: 200,
      }}
    >
      {/* Subtle gradient accent line */}
      <div
        className="absolute top-0 left-0 w-full h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${accent}00, ${accent}50, ${accent}00)`,
        }}
      />

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg
            className="w-5 h-5 text-amber-400"
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
          </svg>
        </div>

        {/* Content */}
        <div
          className={`flex-1 min-w-0 transition-opacity duration-300 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          <p className="text-base text-navy-100 font-medium leading-relaxed mb-3">
            {h.goal}
          </p>
          <p className="text-sm text-navy-300 leading-relaxed">{h.summary}</p>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-[10px] text-navy-400 bg-navy-800/60 rounded-full px-2.5 py-0.5">
              {successLabel}
            </span>
            <span className="text-[10px] text-amber-400">
              {h.helpfulness === "essential" ? "Essential" : "Very Helpful"}
            </span>
          </div>
        </div>

        {/* Navigation arrows */}
        {highlights.length > 1 && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button
              onClick={goToPrev}
              className="p-1 text-navy-500 hover:text-navy-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="p-1 text-navy-500 hover:text-navy-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Bottom row: progress dots left, category filters right */}
      <div className="flex items-center justify-between mt-4">
        {/* Progress dots */}
        {highlights.length > 1 ? (
          <div className="flex items-center gap-1.5">
            {highlights.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setIsTransitioning(true);
                  setTimeout(() => {
                    setCurrentIndex(i);
                    setIsTransitioning(false);
                  }, 300);
                }}
                className="transition-all duration-200"
                style={{
                  width: i === currentIndex ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    i === currentIndex
                      ? accent
                      : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>
        ) : (
          <div />
        )}

        {/* Category filters */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                px-2 py-0.5 text-[9px] rounded-full transition-all duration-200
                ${
                  activeCategory === cat
                    ? "text-white bg-white/10 border border-white/20"
                    : "text-navy-500 hover:text-navy-300 border border-transparent"
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
