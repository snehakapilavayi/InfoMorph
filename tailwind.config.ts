import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#477A3C',
          dark: '#3A6331',
          light: '#8DBF67',
          surface: '#F8FAF7',
          surfaceAlt: '#F0F5EE',
          border: '#DCE7D9',
          borderSubtle: '#ECF2EB',
          tint: '#EAF4E3',
          subtle: '#F4F9F1',
          active: '#EBF3E8',
          50: '#f2f8ef',
          100: '#e1f0dc',
          200: '#c5e2bd',
          500: '#477a3c',
          600: '#3a6631',
          700: '#2f5127',
          800: '#274221',
          900: '#1e341b',
        },
        neutral: {
          surface: '#FBFDFB',
          border: '#E8EFE6',
          muted: '#657361',
          text: '#172019',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        button: '10px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.04)',
        '2xs': '0 1px 1px rgba(0, 0, 0, 0.02)',
        brand: '0 2px 8px rgba(71, 122, 60, 0.15)',
      },
    },
  },
  plugins: [],
};
export default config;
