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
        background: "#12141A",
        surface: "#1C1F27",
        border: "#2A2E38",
        foreground: "#EDEFF3",
        muted: "#9BA1AE",
        accent: "#E08A4C",
        success: "#3DB56A",
        danger: "#E2554A",
        warning: "#E0B94C",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
