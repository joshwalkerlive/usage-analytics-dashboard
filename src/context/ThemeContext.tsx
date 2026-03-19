import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeType = "morning" | "day" | "evening" | "dark" | "retro";

export interface ThemeColors {
  // Primary palette
  navy: string;
  accent: string;

  // Navy scale (for visual hierarchy)
  navyScale: {
    100: string;  // Lightest text on dark backgrounds
    300: string;  // Secondary text
    400: string;  // Tertiary text, muted elements
    600: string;  // Hover backgrounds
    700: string;  // Borders
    900: string;  // Card backgrounds
  };

  // Backgrounds
  bg: {
    primary: string;
    secondary: string;
    tertiary: string;
  };

  // Text
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };

  // UI elements
  border: string;
  hover: string;

  // Chart colors
  chartPrimary: string;
  chartSecondary: string;
  chartPositive: string;
  chartNegative: string;
  chartNeutral: string;

  // Special effects
  glowColor: string;
  glowIntensity: string;
}

export interface Theme {
  name: ThemeType;
  label: string;
  colors: ThemeColors;
  description: string;
  timeRange?: string;
}

interface ThemeContextType {
  currentTheme: Theme;
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme definitions with behavioral science principles
const THEMES: Record<ThemeType, Theme> = {
  morning: {
    name: "morning",
    label: "Morning",
    timeRange: "5am - 9am",
    description: "Warm, gentle tones for waking hours. Reduced blue light to ease circadian rhythm transitions.",
    colors: {
      navy: "#0f1829",
      accent: "#f5a623",
      bg: {
        primary: "#1a1f3a",
        secondary: "#252d4a",
        tertiary: "#1f2740",
      },
      text: {
        primary: "#e8e9f3",
        secondary: "#b4b8cc",
        tertiary: "#8a8fa0",
      },
      border: "#3a4155",
      hover: "#3f4960",
      navyScale: {
        100: "#d5d3e8",
        300: "#8b87b6",
        400: "#6e699e",
        600: "#413d6e",
        700: "#322f57",
        900: "#1c1a41",
      },
      chartPrimary: "#f5a623",
      chartSecondary: "#ffc145",
      chartPositive: "#6ee7b7",
      chartNegative: "#f97316",
      chartNeutral: "#94a3b8",
      glowColor: "#f5a623",
      glowIntensity: "0 0 15px rgba(245, 166, 35, 0.4)",
    },
  },

  day: {
    name: "day",
    label: "Day",
    timeRange: "9am - 5pm",
    description: "Bright, energetic colors for peak productivity hours. Balanced blue light for alertness.",
    colors: {
      navy: "#1c1a41",
      accent: "#d7e260",
      bg: {
        primary: "#15131f",
        secondary: "#1f1d33",
        tertiary: "#2a273f",
      },
      text: {
        primary: "#f5f5f5",
        secondary: "#d4d4d8",
        tertiary: "#9ca3af",
      },
      border: "#3f3b5c",
      hover: "#4a4662",
      navyScale: {
        100: "#d5d3e8",
        300: "#8b87b6",
        400: "#6e699e",
        600: "#413d6e",
        700: "#322f57",
        900: "#1c1a41",
      },
      chartPrimary: "#d7e260",
      chartSecondary: "#b5d334",
      chartPositive: "#10b981",
      chartNegative: "#ef4444",
      chartNeutral: "#64748b",
      glowColor: "#d7e260",
      glowIntensity: "0 0 20px rgba(215, 226, 96, 0.5)",
    },
  },

  evening: {
    name: "evening",
    label: "Evening",
    timeRange: "5pm - 9pm",
    description: "Warm, calming transition theme. Reduced blue light for evening comfort while maintaining focus.",
    colors: {
      navy: "#1a1625",
      accent: "#f97316",
      bg: {
        primary: "#16131f",
        secondary: "#1f1a2e",
        tertiary: "#2a233d",
      },
      text: {
        primary: "#f0e7ff",
        secondary: "#d4c5f9",
        tertiary: "#a89cd8",
      },
      border: "#3d3352",
      hover: "#4a3f5e",
      navyScale: {
        100: "#d5d3e8",
        300: "#8b87b6",
        400: "#6e699e",
        600: "#413d6e",
        700: "#322f57",
        900: "#1c1a41",
      },
      chartPrimary: "#f97316",
      chartSecondary: "#fb923c",
      chartPositive: "#84cc16",
      chartNegative: "#f43f5e",
      chartNeutral: "#a78bfa",
      glowColor: "#f97316",
      glowIntensity: "0 0 18px rgba(249, 115, 22, 0.45)",
    },
  },

  dark: {
    name: "dark",
    label: "Dark Mode",
    timeRange: "9pm - 5am",
    description: "True dark mode with minimal blue light. Optimized for nighttime use and circadian rhythm support.",
    colors: {
      navy: "#0d0811",
      accent: "#c084fc",
      bg: {
        primary: "#0f0a15",
        secondary: "#1a1427",
        tertiary: "#251f35",
      },
      text: {
        primary: "#e9d5ff",
        secondary: "#d8b4fe",
        tertiary: "#c4b5fd",
      },
      border: "#3c2f5c",
      hover: "#4a3f6b",
      navyScale: {
        100: "#d5d3e8",
        300: "#8b87b6",
        400: "#6e699e",
        600: "#413d6e",
        700: "#322f57",
        900: "#1c1a41",
      },
      chartPrimary: "#c084fc",
      chartSecondary: "#d8b4fe",
      chartPositive: "#86efac",
      chartNegative: "#f472b6",
      chartNeutral: "#9f7aea",
      glowColor: "#c084fc",
      glowIntensity: "0 0 16px rgba(192, 132, 252, 0.35)",
    },
  },

  retro: {
    name: "retro",
    label: "Retro",
    description: "Synthwave arcade. Neon glows and CRT vibes for maximum nostalgia.",
    colors: {
      navy: "#0d0015",
      accent: "#ff2d78",
      bg: {
        primary: "#07000d",
        secondary: "#110019",
        tertiary: "#1a0028",
      },
      text: {
        primary: "#00e5ff",
        secondary: "#ff80d0",
        tertiary: "#9966ff",
      },
      border: "#ff2d78",
      hover: "#220030",
      navyScale: {
        100: "#e0ccff",
        300: "#9966ff",
        400: "#7744dd",
        600: "#440088",
        700: "#330066",
        900: "#1a0028",
      },
      chartPrimary: "#ff2d78",
      chartSecondary: "#00e5ff",
      chartPositive: "#39ff14",
      chartNegative: "#ff6600",
      chartNeutral: "#aa00ff",
      glowColor: "#ff2d78",
      glowIntensity: "0 0 20px rgba(255, 45, 120, 0.7), 0 0 40px rgba(255, 45, 120, 0.3)",
    },
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeType>("morning");

  const currentTheme = THEMES[theme];
  const availableThemes = Object.values(THEMES);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const colors = currentTheme.colors;

    root.style.setProperty("--color-navy", colors.navy);
    root.style.setProperty("--color-accent", colors.accent);
    root.style.setProperty("--color-bg-primary", colors.bg.primary);
    root.style.setProperty("--color-bg-secondary", colors.bg.secondary);
    root.style.setProperty("--color-text-primary", colors.text.primary);
    root.style.setProperty("--color-text-secondary", colors.text.secondary);
    root.style.setProperty("--color-border", colors.border);
    root.style.setProperty("--color-glow", colors.glowColor);
    root.style.setProperty("--glow-intensity", colors.glowIntensity);

    // Set navy scale variables for secondary color hierarchy
    root.style.setProperty("--color-navy-100", colors.navyScale[100]);
    root.style.setProperty("--color-navy-300", colors.navyScale[300]);
    root.style.setProperty("--color-navy-400", colors.navyScale[400]);
    root.style.setProperty("--color-navy-600", colors.navyScale[600]);
    root.style.setProperty("--color-navy-700", colors.navyScale[700]);
    root.style.setProperty("--color-navy-900", colors.navyScale[900]);

    // Set data-theme attribute for CSS scoping
    root.setAttribute("data-theme", currentTheme.name);

    // Directly style the body so Tailwind preflight doesn't override theme bg
    document.body.style.backgroundColor = colors.bg.primary;
    document.body.style.color = colors.text.primary;
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, theme, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
