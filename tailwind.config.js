/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        heading: ['var(--font-oswald)', 'sans-serif'], // Custom header font
      },
      colors: {
        // Oura Palette: Darker, sharper, grounded.
        primary: {
          DEFAULT: "#171717", // Neutral-900 (Deep Black)
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#57534E", // Stone-600 (Earth tone)
          foreground: "#FAFAFA",
        },
        accent: {
          DEFAULT: "#D97706", // Amber-600 (A sharp masculine pop color, optional)
          foreground: "#FFFFFF",
        },
        background: "#FAFAFA", // Neutral-50
        surface: "#FFFFFF",
        border: "#E5E5E5",
      },
      borderRadius: {
        // Overriding defaults to be sharper for "No Footprint"
        'none': '0',
        'sm': '0.125rem',
        DEFAULT: '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        // Removing xl, 2xl roundedness usage in main UI
      }
    },
  },
  plugins: [],
};