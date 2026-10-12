/** Tailwind config — brand colours, fonts and animations live here.
 *  After changing classes in HTML/JS run:  npm run build   (or npm run dev to watch) */
module.exports = {
  content: ["./*.html", "./pages/**/*.html", "./assets/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#272151",
          50: "#f1f0f8",
          100: "#e2e0f0",
          200: "#c4c0e0",
          300: "#9a93c7",
          400: "#6d64a6",
          500: "#4a4285",
          600: "#3a3370",
          700: "#272151",
          800: "#1d183f",
          900: "#130f2e",
        },
        lime: {
          DEFAULT: "#7fb829",
          50: "#f4f9ea",
          100: "#e6f2cf",
          200: "#cde6a1",
          300: "#acd468",
          400: "#93c63f",
          500: "#7fb829",
          600: "#67961f",
          700: "#4f731b",
          800: "#3f5b1a",
          900: "#354d19",
        },
        cream: "#faf8f1",
      },
      fontFamily: {
        display: ['"Archivo Black"', "Impact", "system-ui", "sans-serif"],
        sans: ['"Archivo"', "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        hand: ['"Caveat"', "cursive"],
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(39,33,81,0.25)",
        lift: "0 30px 60px -25px rgba(39,33,81,0.45)",
        glow: "0 0 0 6px rgba(127,184,41,0.25)",
      },
      borderRadius: { "4xl": "2rem", "5xl": "2.5rem" },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-14px)" } },
        floatRot: { "0%,100%": { transform: "translateY(0) rotate(-4deg)" }, "50%": { transform: "translateY(-16px) rotate(2deg)" } },
        spinSlow: { to: { transform: "rotate(360deg)" } },
        marquee: { to: { transform: "translateX(-50%)" } },
        bounceSoft: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(8px)" } },
        pulseRing: { "0%": { transform: "scale(.8)", opacity: ".8" }, "100%": { transform: "scale(2.2)", opacity: "0" } },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "float-rot": "floatRot 7s ease-in-out infinite",
        "spin-slow": "spinSlow 28s linear infinite",
        marquee: "marquee 32s linear infinite",
        "bounce-soft": "bounceSoft 2s ease-in-out infinite",
        "pulse-ring": "pulseRing 2s ease-out infinite",
      },
    },
  },
  plugins: [],
};
