import { useTheme, type ThemeType } from "@/context/ThemeContext";

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function ThemeSelector() {
  const { theme, setTheme, availableThemes, currentTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      {availableThemes.map((t) => {
        const isActive = theme === t.name;
        return (
          <button
            key={t.name}
            onClick={() => setTheme(t.name as ThemeType)}
            title={`${t.label}${t.timeRange ? ` (${t.timeRange})` : ""}`}
            className={`
              px-2.5 py-1.5 text-xs font-medium rounded-md
              transition-all duration-200
              ${
                isActive
                  ? "text-white"
                  : "text-white/70 hover:text-white hover:bg-navy-800/50"
              }
            `}
            style={
              isActive
                ? {
                    backgroundColor: hexToRgba(currentTheme.colors.accent, 0.25),
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }
                : undefined
            }
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
