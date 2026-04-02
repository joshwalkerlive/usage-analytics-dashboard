import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { hexToRgba } from "@/lib/chart-utils";
import { NavThemeIcons } from "./NavThemeIcons";

const sections = [
  { id: "at-a-glance", label: "At a Glance" },
  { id: "stats", label: "Stats" },
  { id: "charts", label: "Charts" },
  { id: "usage", label: "Usage" },
  { id: "wins", label: "Wins" },
  { id: "friction", label: "Friction" },
  { id: "recommendations", label: "Recommendations" },
  { id: "horizon", label: "Horizon" },
];

const iconMap: Record<string, JSX.Element> = {
  "at-a-glance": (
    <svg className="w-4 h-4 inline mr-1.5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM15 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zM5 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM15 13a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
    </svg>
  ),
  stats: (
    <svg className="w-4 h-4 inline mr-1.5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
    </svg>
  ),
  charts: (
    <svg className="w-4 h-4 inline mr-1.5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  ),
  usage: (
    <svg className="w-4 h-4 inline mr-1.5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10.5 1.5H5a3.5 3.5 0 00-3.5 3.5v7a3.5 3.5 0 003.5 3.5h10a3.5 3.5 0 003.5-3.5V9.25a.75.75 0 00-1.5 0V12a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5.5a.75.75 0 000-1.5zm6-1a.75.75 0 01.75.75v4a.75.75 0 01-1.5 0V2.25A.75.75 0 0116.5.5z" />
    </svg>
  ),
  wins: (
    <svg className="w-4 h-4 inline mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M4 4h3v8l4-3 4 3V4h3M4 4V3h16v1" />
      <path strokeLinecap="round" d="M7 4h2v4M11 4h2v4M15 4h2v4" />
    </svg>
  ),
  friction: (
    <svg className="w-4 h-4 inline mr-1.5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 100-2 1 1 0 000 2z" />
    </svg>
  ),
  recommendations: (
    <svg className="w-4 h-4 inline mr-1.5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  horizon: (
    <svg className="w-4 h-4 inline mr-1.5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
    </svg>
  ),
};

export function NavTOC() {
  const { currentTheme, theme } = useTheme();
  const bgPrimary = currentTheme.colors.bg.primary;
  const isRetro = theme === "retro";
  const [activeSection, setActiveSection] = useState<string>("");

  // Detect active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top >= 0 && rect.top < window.innerHeight / 2) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3"
      style={{
        backgroundColor: hexToRgba(bgPrimary, 0),
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => handleClick(section.id)}
                className={`
                  ${isRetro ? "px-1.5 py-1" : "px-2 py-1.5 text-xs"} font-medium rounded-md
                  transition-all duration-300 whitespace-nowrap flex items-center
                  ${
                    isActive
                      ? "text-accent"
                      : "text-white hover:text-accent"
                  }
                `}
                style={isRetro ? { transform: "scale(0.88)", transformOrigin: "center" } : undefined}
              >
                {iconMap[section.id]}
                {section.label}
              </button>
            );
          })}
        </div>
        <NavThemeIcons />
      </div>
    </nav>
  );
}
