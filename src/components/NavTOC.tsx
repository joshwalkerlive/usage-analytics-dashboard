import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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

export function NavTOC() {
  const { currentTheme } = useTheme();
  const bgPrimary = currentTheme.colors.bg.primary;
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
        backgroundColor: hexToRgba(bgPrimary, 0.65),
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => handleClick(section.id)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-md
                transition-all duration-300 whitespace-nowrap
                ${
                  isActive
                    ? "text-accent"
                    : "text-navy-300 hover:text-white"
                }
              `}
            >
              {section.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
