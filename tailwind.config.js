/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: {
          DEFAULT: "#1E88E5",
          50:  "#E3F2FD",
          100: "#BBDEFB",
          200: "#90CAF9",
          300: "#64B5F6",
          400: "#42A5F5",
          500: "#1E88E5",
          600: "#1976D2",
          700: "#1565C0",
          800: "#0D47A1",
          900: "#0A2E6E",
        },
        // Accent
        accent: {
          DEFAULT: "#43A047",
          light: "#A5D6A7",
          dark: "#2E7D32",
        },
        // Warning
        warning: {
          DEFAULT: "#FFA000",
          light: "#FFD54F",
          dark: "#E65100",
        },
        // Danger / Urgent
        danger: {
          DEFAULT: "#E53935",
          light: "#EF9A9A",
          dark: "#B71C1C",
        },
        // Neutrals / Background
        surface: {
          DEFAULT: "#161B22",   // card bg
          raised: "#21262D",    // elevated card
          overlay: "#30363D",   // overlays, inputs
        },
        bg: {
          DEFAULT: "#0D1117",   // main background
          secondary: "#161B22",
        },
        // Text
        txt: {
          primary:   "#E6EDF3",
          secondary: "#8B949E",
          muted:     "#484F58",
          inverse:   "#0D1117",
        },
        // Frisbee-brand green accent
        disc: {
          DEFAULT: "#56D364",
          light:   "#7EE787",
          dark:    "#3FB950",
        },
      },
      fontFamily: {
        sans:  ["Inter_400Regular", "System"],
        mid:   ["Inter_500Medium", "System"],
        semi:  ["Inter_600SemiBold", "System"],
        bold:  ["Inter_700Bold", "System"],
        black: ["Inter_900Black", "System"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      spacing: {
        "4.5": "18px",
        "13":  "52px",
        "15":  "60px",
        "18":  "72px",
        "22":  "88px",
        "88":  "352px",
      },
    },
  },
  plugins: [],
};
