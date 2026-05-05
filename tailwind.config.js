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
          DEFAULT: "#388BFD",   // Electric blue
          50:  "#E3F2FD",
          100: "#BBDEFB",
          200: "#79C0FF",       // Lighter electric
          300: "#58A6FF",
          400: "#388BFD",
          500: "#1F6FEB",       // Solid primary
          600: "#1158C7",
          700: "#0D419D",
          800: "#092F73",
          900: "#051D4D",
        },
        // Accent
        accent: {
          DEFAULT: "#3FB950",   // Frisbee green
          light: "#56D364",
          dark: "#2EA043",
        },
        // Warning
        warning: {
          DEFAULT: "#D29922",
          light: "#E3B341",
          dark: "#9E6A03",
        },
        // Danger / Urgent
        danger: {
          DEFAULT: "#F85149",   // Vibrant red
          light: "#FF7B72",
          dark: "#DA3633",
        },
        // Neutrals / Background
        surface: {
          DEFAULT: "#161B22",   // card bg
          raised: "#21262D",    // elevated card
          overlay: "#30363D",   // overlays, inputs
          border: "#424D5B",    // subtle borders
        },
        bg: {
          DEFAULT: "#0D1117",   // main background
          secondary: "#010409", // deepest background
        },
        // Text
        txt: {
          primary:   "#F0F6FC",
          secondary: "#8B949E",
          muted:     "#484F58",
          inverse:   "#0D1117",
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
