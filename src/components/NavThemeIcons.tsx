import { useState, useEffect } from "react";
import { useTheme, type ThemeType } from "@/context/ThemeContext";

/**
 * Miniature theme selector icons for the sticky NavTOC bar.
 * Each icon represents a theme with a smooth gradient glow on hover.
 */

const THEME_ICONS: {
  name: ThemeType;
  label: string;
  accent: string;
  gradient: string;
}[] = [
  {
    name: "morning",
    label: "Morning",
    accent: "#f5a623",
    gradient: "from-amber-400 via-orange-300 to-yellow-400",
  },
  {
    name: "day",
    label: "Day",
    accent: "#d7e260",
    gradient: "from-yellow-300 via-lime-400 to-emerald-300",
  },
  {
    name: "evening",
    label: "Evening",
    accent: "#f97316",
    gradient: "from-orange-500 via-rose-400 to-purple-400",
  },
  {
    name: "dark",
    label: "Dark Mode",
    accent: "#c084fc",
    gradient: "from-purple-400 via-indigo-400 to-violet-500",
  },
  {
    name: "retro",
    label: "Retro",
    accent: "#ff2d78",
    gradient: "from-pink-500 via-fuchsia-400 to-cyan-400",
  },
];

function SunriseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5M18.364 5.636l-1.06 1.06M21 12h-1.5M4.5 12H3M6.696 6.696l-1.06-1.06M12 18a6 6 0 010-12" />
      <path strokeLinecap="round" d="M4 18h16" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5M18.364 5.636l-1.06 1.06M21 12h-1.5M4.5 12H3M6.696 6.696l-1.06-1.06M12 18v1.5M17.303 17.303l1.061 1.061M6.697 17.303l-1.06 1.061" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  );
}

function RingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function RetroIcon({ dancing }: { dancing: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-4 h-4 ${dancing ? "animate-retro-dance" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      {/* Retro game controller / joystick */}
      <rect x="2" y="4" width="20" height="12" rx="2" />
      <circle cx="8" cy="10" r="2.5" />
      <line x1="8" y1="7.5" x2="8" y2="12.5" />
      <line x1="5.5" y1="10" x2="10.5" y2="10" />
      <circle cx="16" cy="8.5" r="1" fill="currentColor" />
      <circle cx="18.5" cy="10.5" r="1" fill="currentColor" />
      <path d="M9 16v2.5M15 16v2.5" />
    </svg>
  );
}

const ICON_COMPONENTS: Record<ThemeType, (props: { dancing: boolean }) => JSX.Element> = {
  morning: () => <SunriseIcon />,
  day: () => <SunIcon />,
  evening: () => <MoonIcon />,
  dark: () => <RingIcon />,
  retro: ({ dancing }) => <RetroIcon dancing={dancing} />,
};

export function NavThemeIcons() {
  const { theme, setTheme } = useTheme();
  const [hoveredTheme, setHoveredTheme] = useState<ThemeType | null>(null);
  const [isDancing, setIsDancing] = useState(false);

  // Easter egg: retro mascot dances occasionally
  useEffect(() => {
    const startDance = () => {
      setIsDancing(true);
      setTimeout(() => setIsDancing(false), 1200);
    };

    // Dance on a random interval between 15-45 seconds
    const scheduleNext = () => {
      const delay = 15000 + Math.random() * 30000;
      return setTimeout(() => {
        if (theme === "retro") startDance();
        scheduleNext();
      }, delay);
    };

    const timer = scheduleNext();
    return () => clearTimeout(timer);
  }, [theme]);

  return (
    <div className="flex items-center gap-1">
      {THEME_ICONS.map((t) => {
        const isActive = theme === t.name;
        const isHovered = hoveredTheme === t.name;
        const IconComponent = ICON_COMPONENTS[t.name];

        return (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            onMouseEnter={() => setHoveredTheme(t.name)}
            onMouseLeave={() => setHoveredTheme(null)}
            title={t.label}
            className="relative p-1.5 rounded-md transition-all duration-200"
            style={{
              color: isActive ? t.accent : isHovered ? t.accent : "rgba(255,255,255,0.4)",
            }}
          >
            {/* Glow chase effect on hover */}
            {isHovered && (
              <span
                className="absolute inset-0 rounded-md animate-glow-chase"
                style={{
                  background: `conic-gradient(from var(--glow-angle, 0deg), transparent 0%, ${t.accent}40 10%, ${t.accent}80 20%, transparent 30%)`,
                  mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  maskComposite: "exclude",
                  WebkitMaskComposite: "xor",
                  padding: "1.5px",
                }}
              />
            )}
            {/* Active indicator dot */}
            {isActive && (
              <span
                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                style={{ backgroundColor: t.accent }}
              />
            )}
            {IconComponent({ dancing: isDancing && t.name === "retro" })}
          </button>
        );
      })}
    </div>
  );
}
