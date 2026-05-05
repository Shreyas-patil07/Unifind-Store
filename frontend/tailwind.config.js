/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#4f46e5',
        'primary-hover': '#4338ca',
        'primary-active': '#3730a3',
        indigo: {
          950: '#1e1b4b',
        },
        violet: {
          950: '#2e1065',
        },
        // YouTube-style dark mode colors
        'yt-dark': {
          bg: '#0f0f0f',
          card: '#212121',
          border: '#3f3f3f',
          text: '#f1f1f1',
          'text-secondary': '#aaaaaa',
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.5s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'spin-slow': 'spin 8s linear infinite',
        'gradient-x': 'gradientX 4s ease infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(79, 70, 229, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(79, 70, 229, 0.6)' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      boxShadow: {
        'glow-indigo': '0 0 30px rgba(79, 70, 229, 0.3)',
        'glow-blue': '0 0 30px rgba(37, 99, 235, 0.3)',
        'glow-violet': '0 0 30px rgba(124, 58, 237, 0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.08)',
        'card-hover': '0 12px 40px rgba(79, 70, 229, 0.15)',
      },
      backgroundSize: {
        '200%': '200% 200%',
      },
    },
  },
  plugins: [],
}
