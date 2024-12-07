// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./homedock-ui/vue3/**/*.{vue,js,ts,jsx,tsx,html}", "./homedock-ui/template/**/*.html"],
  theme: {
    extend: {
      animation: {
        loading: "loading 1.5s infinite",
      },
      keyframes: {
        loading: {
          "0%": { left: "-100%", width: "100%" },
          "50%": { width: "100%" },
          "100%": { left: "100%", width: "100%" },
        },
      },
    },
  },
  plugins: [],
};
