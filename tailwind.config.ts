import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],

  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: [
          "var(--font-space-grotesk)",
          "var(--font-inter)",
          "sans-serif",
        ],
      },

      colors: {
        // 🔵 Azul institucional
        primary: {
          DEFAULT: "#0057A8",
          dark: "#003B73",
          light: "#E6F1FA",
        },

        // 🟡 Cor de destaque
        accent: {
          DEFAULT: "#C98A2C",
          light: "#FBF0DD",
        },

        // ⚪ Superfícies
        surface: "#FFFFFF",

        // 🔵 Fundo geral
        bg: "#F4F8FC",

        // ⚫ Textos
        ink: {
          DEFAULT: "#152536",
          muted: "#5B6B7A",
        },

        // 🔲 Bordas
        border: "#DCE5ED",

        // 🔴 Erros
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