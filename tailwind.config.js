/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  // Performance: Only include used classes
  mode: 'jit',
  
  theme: {
    extend: {
      // Prizma Science brand colors
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe', 
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        science: {
          physics: '#3498db',
          chemistry: '#27ae60', 
          biology: '#8e44ad',
          astronomy: '#1abc9c',
          engineering: '#6c757d',
          geology: '#855a45',
          electronics: '#28a745',
          mechanics: '#4a6b8a',
          optics: '#20c997',
          genetics: '#6610f2',
          magnetism: '#dc3545',
          zoology: '#fd7e14',
          nature: '#198754'
        }
      },
      
      // Custom animations
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        }
      },
      
      // Typography improvements
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      
      // Spacing for science components
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Custom shadows for cards
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'science': '0 8px 25px -8px rgba(59, 130, 246, 0.3)',
      },
      
      // Responsive breakpoints for better mobile experience
      screens: {
        'xs': '475px',
      },
      
      // Z-index scale for layering
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      }
    },
  },
  
  plugins: [
    // Custom plugin for component classes
    function({ addComponents, theme }) {
      addComponents({
        '.btn-science': {
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          borderRadius: theme('borderRadius.lg'),
          fontWeight: theme('fontWeight.semibold'),
          fontSize: theme('fontSize.sm'),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.card-hover'),
          }
        },
        '.card-science': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.xl'),
          boxShadow: theme('boxShadow.card'),
          padding: theme('spacing.6'),
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: theme('boxShadow.card-hover'),
            transform: 'translateY(-2px)',
          }
        },
        '.gradient-science': {
          background: `linear-gradient(135deg, ${theme('colors.science.physics')}, ${theme('colors.science.astronomy')})`,
        }
      })
    }
  ],
  
  // Performance: Purge unused styles in production
  future: {
    hoverOnlyWhenSupported: true,
  },
}