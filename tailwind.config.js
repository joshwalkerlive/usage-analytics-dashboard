import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary theme colors (CSS variable-based for dynamic theming)
        navy: {
          50: "#eeedf5",
          100: "#d5d3e8",
          200: "#b0adcf",
          300: "#8b87b6",
          400: "#6e699e",
          500: "#524d86",
          600: "#413d6e",
          700: "#322f57",
          800: "#252341",
          900: "#1c1a41",
          950: "#110f2e",
          DEFAULT: "var(--color-navy)",
        },
        accent: {
          50: "#fafde6",
          100: "#f2f9c0",
          200: "#e8f497",
          300: "#d7e260",
          400: "#c8d43c",
          500: "#b5d334",
          600: "#96b02b",
          700: "#728623",
          800: "#4f5d1c",
          900: "#303814",
          DEFAULT: "var(--color-accent)",
          muted: "var(--color-accent)",
        },

        // Theme-aware color aliases (from CSS variables)
        "bg-primary": "var(--color-bg-primary)",
        "bg-secondary": "var(--color-bg-secondary)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "border-theme": "var(--color-border)",
        "glow-color": "var(--color-glow)",

        // Navy scale color aliases (secondary hierarchy)
        "navy-100": "var(--color-navy-100)",
        "navy-300": "var(--color-navy-300)",
        "navy-400": "var(--color-navy-400)",
        "navy-600": "var(--color-navy-600)",
        "navy-700": "var(--color-navy-700)",
        "navy-900": "var(--color-navy-900)",

        surface: "#f4f4f4",
      },
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
}
