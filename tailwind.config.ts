import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "var(--font-inter)", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#1F6E4A",
          dark: "#123D2A",
          light: "#E7F3EC",
        },
        accent: {
          DEFAULT: "#C98A2C",
          light: "#FBF0DD",
        },
        surface: "#FFFFFF",
        bg: "#F5F8F6",
        ink: {
          DEFAULT: "#16241C",
          muted: "#5B6B62",
        },
        border: "#DEE6E1",
        danger: {
          DEFAULT: "#B23B3B",
          light: "#FBEAEA",
        },
      },
      borderRadius: {
        md: "10px",
        sm: "6px",
      },
    },
  },
  plugins: [],
};
export default config;
