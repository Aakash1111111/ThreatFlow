/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        card: '#1E293B',
        border: '#334155',
        primary: '#6366F1',
        risk: {
          critical: '#EF4444',
          high: '#F97316',
          medium: '#EAB308',
          low: '#22C55E',
          clean: '#94A3B8'
        },
        textPrimary: '#FFFFFF',
        textSecondary: '#94A3B8'
      }
    },
  },
  plugins: [],
}
