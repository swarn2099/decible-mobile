/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        surface: "#F5F5F7",
        "surface-card": "#FFFFFF",
        "on-surface": "#1A1A2E",
        "on-surface-secondary": "#6E6E7A",
        "on-surface-dim": "#A0A0B0",
        decibel: "#0B0B0F",
        card: "#15151C",
        "card-hover": "#1C1C28",
        pink: "#FF4D6A",
        purple: "#9B6DFF",
        blue: "#4D9AFF",
        teal: "#00D4AA",
        yellow: "#FFD700",
        gray: "#8E8E9A",
        "light-gray": "#55556A",
      },
      fontFamily: {
        poppins: ["Poppins_400Regular"],
        "poppins-medium": ["Poppins_500Medium"],
        "poppins-semibold": ["Poppins_600SemiBold"],
        "poppins-bold": ["Poppins_700Bold"],
      },
    },
  },
  plugins: [],
};
