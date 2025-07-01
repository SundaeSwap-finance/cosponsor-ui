import { plugins, theme } from '@sundaeswap/tailwind-config'

export default {
  content: [
    './src/components/**/*.tsx',
    './src/hooks/**/*.tsx',
    './src/pages/**/*.tsx',
    './src/layouts/**/*.tsx',
    './node_modules/@sundaeswap/ui-toolkit/src/**/*',
  ],

  darkMode: 'class',
  theme: {
    ...theme,
    backgroundImage: {
      ...theme.backgroundImage,
      'news-bg': "url('./backgrounds/news-bg.png')",
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
      },
      animation: {
        text: 'text 3500ms ease infinite',
        float: 'float 6s ease-in-out infinite',
        'float-quick': 'float 2s ease-in-out infinite',
        floatingGradient: 'floatingGradient 10s ease-in-out infinite',
        ripple: 'ripple 1.9s ease-out infinite',
        shake: 'shake 0.3s ease-in-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out forwards',
        'fade-out-down': 'fadeOutDown 0.3s ease-in forwards',
      },
      keyframes: {
        floatingGradient: {
          '0%, 100%': {
            'background-position': '0% 50%',
          },
          '50%': {
            'background-position': '100% 50%',
          },
        },
        text: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
        float: {
          '0%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
          '100%': {
            transform: 'translateY(0px)',
          },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeOutDown: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(10px)' },
        },
      },
    },
  },
  plugins,
}
