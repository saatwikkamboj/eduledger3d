/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05060a',
          900: '#0a0c14',
          800: '#10131e',
          700: '#171b29',
          600: '#212639',
        },
        neon: {
          emerald: '#34ffb0',
          amber: '#ffb547',
          crimson: '#ff4d6d',
          violet: '#a78bfa',
          cyan: '#5eead4',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Sora', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px -4px rgba(52,255,176,0.45)',
        'glow-amber': '0 0 24px -4px rgba(255,181,71,0.45)',
        'glow-crimson': '0 0 24px -4px rgba(255,77,109,0.5)',
        glass: '0 8px 32px 0 rgba(0,0,0,0.45)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-18px) rotate(6deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.55 },
        },
      },
      animation: {
        floaty: 'floaty 8s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        pulseGlow: 'pulseGlow 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

