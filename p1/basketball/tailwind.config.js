/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fever-red': '#FF4444',
        'fever-orange': '#FF8800',
        'fever-yellow': '#FFAA33',
        'fever-blue': '#44AAFF',
        'fever-green': '#44CC44',
        'pixel-dark': '#222222',
        'pixel-darker': '#111111',
      },
      fontFamily: {
        'pixel': ['"Press Start 2P"', 'cursive'],
      },
      animation: {
        'pulse-fast': 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'shake': 'shake 0.3s ease-in-out',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #FF4444, 0 0 10px #FF4444' },
          '100%': { boxShadow: '0 0 20px #FF8800, 0 0 30px #FF8800' },
        }
      }
    },
  },
  plugins: [],
}
