/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  content: ["./src/**/*.{html,ts,scss,css}"],
  theme: {
    extend: {
      keyframes: {
        neonPulse: {
          "0%, 100%": { "border-color": "#6a3cb0" },
          "50%": { "border-color": "#b22084" },
        },
        sweep: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        scanner: {
          "0%": { "stroke-dashoffset": "0" },
          "100%": { "stroke-dashoffset": "1005" }, // sum of dash+gap
        },
        fadeInScale: {
          "0%": { opacity: "0", transform: "scale(0.5)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        moveLeft: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        moveRight: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "neon-pulse": "neonPulse 2s ease-in-out infinite",
        "sweep-light": "sweep 1.5s linear infinite",
        scanner: "scanner 6s linear infinite",
        "spin-slow": "spin 8s linear infinite", // slow spin for image
        "fade-in-scale": "fadeInScale 1.5s ease-out forwards", // text appear and scale
        "move-left": "moveLeft 1s ease-in-out forwards",
        "move-right": "moveRight 1s ease-in-out forwards",
      },
      colors: {
        screen: "#0F0020",
        "purple-0": "#77207a",
        "purple-1": "#6a3cb0",
        "purple-6": "#b22084",
        "purple-2": "#551b98",
        "purple-3": " #691ebe",
        "purple-4": "#36166f",
        "purple-5": "#ca19a4",
        error: "#e11d48",
      },
    },
  },
  plugins: [],
};
