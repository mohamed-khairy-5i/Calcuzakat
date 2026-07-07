import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,ts,md,mdx}"],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", lg: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      fontFamily: {
        sans: ['"Tajawal"', "system-ui", "sans-serif"],
        serif: ['"Amiri"', "serif"],
      },
      colors: {
        brand: {
          50: "#ecfdf3",
          100: "#d1fadf",
          200: "#a6f4c5",
          300: "#6ce9a6",
          400: "#32d583",
          500: "#12b76a",
          600: "#039855",
          700: "#027a48",
          800: "#05603a",
          900: "#054f31",
          950: "#052e20",
        },
        gold: {
          50: "#fdf9ed",
          100: "#f9efcc",
          200: "#f3dd95",
          300: "#ecc65e",
          400: "#e6b23a",
          500: "#dd9420",
          600: "#c4721a",
          700: "#a3521a",
          800: "#85411c",
          900: "#6f371b",
          950: "#3f1b0b",
        },
      },
      boxShadow: {
        soft: "0 4px 24px -8px rgba(5, 96, 58, 0.14)",
        glow: "0 8px 40px -12px rgba(2, 122, 72, 0.45)",
        gold: "0 8px 34px -10px rgba(221, 148, 32, 0.55)",
        card: "0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.10)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
      },
    },
  },
  plugins: [typography],
};
