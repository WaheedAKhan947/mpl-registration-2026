/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#102018",
        muted: "#5a6860",
        paper: "#f7f6ef",
        green: {
          DEFAULT: "#0b6b3a",
          dark: "#064227",
        },
        lime: "#b8e54a",
        gold: "#f4b63d",
        brand: {
          red: "#d83b31",
        },
        navy: {
          DEFAULT: "#0b1c3d",
          dark: "#060f22",
          light: "#16305c",
        },
        ember: "#e8720c",
      },
      boxShadow: {
        panel: "0 22px 60px rgba(6, 66, 39, 0.16)",
        "panel-navy": "0 22px 60px rgba(11, 28, 61, 0.25)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.8s ease-out both",
        "fade-in": "fadeIn 0.9s ease-out both",
      },
    },
  },
  plugins: [],
};
