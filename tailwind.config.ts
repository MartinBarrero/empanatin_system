import type { Config } from "tailwindcss";

// Paleta definida en Claude.md, sección 7 (Diseño visual).
const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0B",
        surface: "#1A1A1D",
        border: "#2C2C30",
        foreground: "#F5F5F0",
        muted: "#A3A3A8",
        accent: "#F2C230",
        success: "#3DB56A",
        danger: "#E2554A",
        warning: "#D9A441",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      boxShadow: {
        glow: "0 0 60px -10px rgba(242, 194, 48, 0.45)",
        "glow-sm": "0 0 24px -6px rgba(242, 194, 48, 0.5)",
      },
    },
  },
  plugins: [],
};
export default config;
