/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kawaii: {
          pink: '#FF85A1',
          'pink-light': '#FFE5EC',
          'pink-dark': '#FB6F92',
          purple: '#BDB2FF',
          'purple-light': '#E8E5FF',
          yellow: '#FFD166',
          'yellow-light': '#FFF3D6',
          mint: '#9BF6FF',
          'mint-light': '#E8FDFF',
          green: '#70E000',
          blue: '#A0C4FF',
          cream: '#FFF9FB',
        }
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },
      boxShadow: {
        'kawaii': '0 8px 0px 0px rgba(251, 111, 146, 0.35)',
        'kawaii-pop': '0 6px 0px 0px rgba(189, 178, 255, 0.4)',
        'kawaii-mint': '0 6px 0px 0px rgba(155, 246, 255, 0.5)',
        'kawaii-yellow': '0 6px 0px 0px rgba(255, 209, 102, 0.5)',
        'kawaii-press': '0 2px 0px 0px rgba(251, 111, 146, 0.4)',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        bounceCute: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        floatCute: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-6px) rotate(1.5deg)' },
        }
      },
      animation: {
        wiggle: 'wiggle 1s ease-in-out infinite',
        'bounce-cute': 'bounceCute 2s ease-in-out infinite',
        'float-cute': 'floatCute 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};
