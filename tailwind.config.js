/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: "#eefcfb",
          100: "#d4f5f3",
          200: "#a9ebe8",
          300: "#6fdcda",
          400: "#3cc3c4",
          500: "#1fa6ab",
          600: "#18858b",
          700: "#186a70",
          800: "#19555a",
          900: "#19484c",
        },
        sand: {
          50: "#fdf9f0",
          100: "#faf0d9",
          200: "#f3ddab",
          300: "#eac378",
          400: "#e2a94e",
          500: "#d98f32",
          600: "#c07327",
          700: "#9f5723",
          800: "#814522",
          900: "#6b391f",
        },
        palm: {
          50: "#f0fbf1",
          100: "#dcf5df",
          200: "#bbe9c2",
          300: "#8ad598",
          400: "#54b967",
          500: "#309e45",
          600: "#227e36",
          700: "#1e642d",
          800: "#1c4f27",
          900: "#184223",
        },
        sunset: {
          400: "#ff9d5c",
          500: "#ff7a30",
          600: "#f25c12",
        },
      },
      backgroundImage: {
        "beach-gradient": "linear-gradient(160deg, #eefcfb 0%, #d4f5f3 35%, #faf0d9 100%)",
      },
    },
  },
  plugins: [],
};
