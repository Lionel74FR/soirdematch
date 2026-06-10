import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#171B2B",
        navy2: "#242A46",
        cream: "#F6EFE3",
        coral: "#F07B5C",
        rose: "#CD6973",
        orange: "#F38C5F",
        gold: "#FFC93C",
      },
      fontFamily: {
        montserrat: ["var(--font-montserrat)", "sans-serif"],
        poppins: ["var(--font-poppins)", "sans-serif"],
        "space-mono": ["var(--font-space-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
