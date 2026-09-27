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
        fin: {
          bg: '#F7F8FA',          // Light neutral background
          panel: '#FFFFFF',       // Card / Panel background
          subtle: '#F1F3F5',      // Hover / secondary background
          border: '#E2E5E9',      // Subtle clean border
          borderSubtle: '#EDF0F3',// Secondary divider border
          muted: '#98A2B3',       // Muted metadata text
          subtext: '#667085',     // Secondary text
          text: '#17202A',        // Primary text
          accent: '#2563EB',      // Primary blue accent
          accentHover: '#1D4ED8', // Darker blue hover
          danger: '#DC2626',      // Critical red
          gold: '#D97706',        // High risk amber
          medium: '#CA8A04',      // Medium yellow
          low: '#16A34A',         // Low risk green
          purple: '#9333EA',      // Customer entity purple
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['IBM Plex Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
