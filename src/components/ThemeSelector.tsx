import { useTheme, type ThemeType } from "@/context/ThemeContext";
import { hexToRgba } from "@/lib/chart-utils";

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
