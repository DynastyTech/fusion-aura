/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#86efac', // Light lime green (Fusion)
          DEFAULT: '#4ade80', // Medium green
          dark: '#22c55e', // Darker green (Aura)
        },
      },
    },
  },
  plugins: [],
};

