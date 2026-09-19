/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2563eb',
          'blue-hover': '#1d4ed8',
          'blue-dark': '#1e40af',
          'blue-light': '#eff6ff',
        },
        slate: {
          dark: '#0f172a',
          card: '#1e293b',
          muted: '#64748b',
          border: '#e2e8f0',
          bg: '#f8fafc',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['Outfit', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleUp: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out forwards',
        slideLeft: 'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        scaleUp: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }
    },
  },
  plugins: [],
}
