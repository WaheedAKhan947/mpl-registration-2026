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
      },
      boxShadow: {
        panel: "0 22px 60px rgba(6, 66, 39, 0.16)",
      },
    },
  },
  plugins: [],
};
