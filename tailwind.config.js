/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clay: {
          bg: '#EEF3F8',        // Soft cloud canvas
          card: '#F4F7FB',      // Clay card surface
          subtle: '#E2EAF2',    // Subtle recessed areas
          border: '#D8E2ED',
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'clay-card': '12px 12px 24px rgba(166, 180, 200, 0.35), -10px -10px 20px rgba(255, 255, 255, 0.9), inset 2px 2px 4px rgba(255, 255, 255, 0.8), inset -2px -2px 4px rgba(166, 180, 200, 0.2)',
        'clay-card-hover': '16px 16px 30px rgba(166, 180, 200, 0.45), -12px -12px 24px rgba(255, 255, 255, 0.95), inset 2px 2px 4px rgba(255, 255, 255, 0.9), inset -2px -2px 4px rgba(166, 180, 200, 0.25)',
        'clay-btn': '6px 6px 14px rgba(166, 180, 200, 0.35), -5px -5px 12px rgba(255, 255, 255, 0.9), inset 1px 1px 2px rgba(255, 255, 255, 0.8)',
        'clay-btn-active': 'inset 3px 3px 6px rgba(166, 180, 200, 0.4), inset -2px -2px 4px rgba(255, 255, 255, 0.8)',
        'clay-inset': 'inset 3px 3px 6px rgba(166, 180, 200, 0.35), inset -3px -3px 6px rgba(255, 255, 255, 0.85)',
        'clay-primary': '8px 8px 18px rgba(99, 102, 241, 0.35), -6px -6px 14px rgba(255, 255, 255, 0.85), inset 2px 2px 3px rgba(255, 255, 255, 0.5), inset -2px -2px 4px rgba(67, 56, 202, 0.4)',
        'clay-success': '6px 6px 14px rgba(16, 185, 129, 0.25), -4px -4px 10px rgba(255, 255, 255, 0.85), inset 1px 1px 2px rgba(255, 255, 255, 0.5), inset -1px -1px 3px rgba(5, 150, 105, 0.3)',
        'clay-danger': '6px 6px 14px rgba(239, 68, 68, 0.25), -4px -4px 10px rgba(255, 255, 255, 0.85), inset 1px 1px 2px rgba(255, 255, 255, 0.5), inset -1px -1px 3px rgba(185, 28, 28, 0.3)',
      }
    },
  },
  plugins: [],
}
