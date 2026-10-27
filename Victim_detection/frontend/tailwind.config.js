/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tactical: {
          bg: '#070a12',
          surface: '#0c1322',
          card: '#101a2e',
          panel: '#152238',
          border: '#1e2d4a',
          hover: '#1a2942',
          amber: '#f59e0b',
          amberGlow: '#fbbf24',
          cyan: '#06b6d4',
          cyanGlow: '#22d3ee',
          red: '#ef4444',
          redGlow: '#f87171',
          emerald: '#10b981',
          emeraldGlow: '#34d399',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Roboto Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'radar-spin': 'spin 4s linear infinite',
        'pulse-subtle': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
