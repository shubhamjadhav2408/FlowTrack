export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0B0C10',
        surface: { 1: '#14161C', 2: '#1C1F27' },
        border: { DEFAULT: 'rgba(255,255,255,0.08)', strong: 'rgba(255,255,255,0.14)' },
        text: { DEFAULT: '#F3F1EC', dim: '#8C8F99', dimmer: '#5D6070' },
        accent: { DEFAULT: '#8B7CF6', soft: 'rgba(139,124,246,0.14)' },
        green: '#6FCF97',
        red: '#E27D6F',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px'
      }
    },
  },
  plugins: [],
}
