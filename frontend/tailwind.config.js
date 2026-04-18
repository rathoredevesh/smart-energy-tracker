/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#030712",
        night: "#07111f",
        tealglow: "#00f5c5",
        electric: "#38bdf8",
        acid: "#d9ff5a",
      },
      boxShadow: {
        neon: "0 0 40px rgba(0, 245, 197, 0.18)",
        glass: "0 30px 90px rgba(2, 8, 23, 0.45)",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Manrope'", "sans-serif"],
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top, rgba(0, 245, 197, 0.14), transparent 35%), radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.12), transparent 32%)",
      },
    },
  },
  plugins: [],
};

