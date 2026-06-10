/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#6C2BD9',   // Deep Purple
          secondary: '#8B5CF6', // Light Purple
          accent: '#A78BFA',    // Accent Purple
          darkBg: '#0D0A1A',    // Dark BG
          cardBg: '#13102A',    // Card BG
          border: 'rgba(108, 43, 217, 0.3)',
          mutedText: '#C4B5FD'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
