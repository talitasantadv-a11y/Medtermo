/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f6f5",
          100: "#e6eae7",
          200: "#cdd6d0",
          300: "#a9b8ae",
          400: "#7f9486",
          500: "#5f7767",
          600: "#4a5f52",
          700: "#3d4d43",
          800: "#333f38",
          900: "#2c3630",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Georgia", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};
