/**
 * Sparlo Brand System - Tailwind Configuration
 *
 * Design Philosophy: Research Infrastructure, Not AI Tool
 * Inspired by Air Company - confidence through restraint
 *
 * Typography carries hierarchy. Color is earned, not decorative.
 * Near-monochrome with purposeful semantic color.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ============================================
      // FONT FAMILY - Suisse Int'l
      // ============================================
      fontFamily: {
        display: ['Suisse Intl', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sans: ['Suisse Intl', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['SF Mono', 'Consolas', 'Liberation Mono', 'monospace'],
      },

      // ============================================
      // TYPOGRAPHY SCALE
      // Premium scale - larger, more confident, like a printed report
      // ============================================
      fontSize: {
        // Display - Report title only
        'display': ['56px', {
          lineHeight: '1.1',
          letterSpacing: '-0.02em',
          fontWeight: '600'
        }],

        // Headline - Section headers
        'headline': ['36px', {
          lineHeight: '1.2',
          letterSpacing: '-0.02em',
          fontWeight: '600'
        }],

        // Title - Card titles, major headings
        'title': ['28px', {
          lineHeight: '1.3',
          letterSpacing: '-0.01em',
          fontWeight: '600'
        }],

        // Subtitle - Key insights, featured content
        'subtitle': ['22px', {
          lineHeight: '1.4',
          letterSpacing: '0',
          fontWeight: '500'
        }],

        // Body Large - Executive summary lead
        'body-lg': ['20px', {
          lineHeight: '1.6',
          fontWeight: '400'
        }],

        // Body - Primary text
        'body': ['18px', {
          lineHeight: '1.6',
          fontWeight: '400'
        }],

        // Body Small - Secondary, descriptions
        'body-sm': ['15px', {
          lineHeight: '1.5',
          fontWeight: '400'
        }],

        // Caption - Metadata, timestamps
        'caption': ['13px', {
          lineHeight: '1.5',
          fontWeight: '500'
        }],

        // Label - Section labels, overlines
        'label': ['11px', {
          lineHeight: '1.3',
          letterSpacing: '0.08em',
          fontWeight: '600'
        }],
      },

      // ============================================
      // COLORS
      // Near-monochrome with purposeful semantic color
      // ============================================
      colors: {
        // Core palette
        'surface': {
          DEFAULT: '#ffffff',
          subtle: '#fafafa',
          muted: '#f4f4f5',
          emphasis: '#18181b',
        },

        'ink': {
          DEFAULT: '#09090b',      // Primary text (zinc-950)
          secondary: '#3f3f46',    // Secondary (zinc-700)
          muted: '#71717a',        // Tertiary (zinc-500)
          subtle: '#a1a1aa',       // Quaternary (zinc-400)
        },

        'line': {
          DEFAULT: '#e4e4e7',      // Default borders (zinc-200)
          subtle: '#f4f4f5',       // Subtle dividers (zinc-100)
          emphasis: '#27272a',     // Dark borders (zinc-800)
        },

        // Semantic - earned, not decorative
        'signal': {
          high: '#059669',         // emerald-600
          'high-subtle': '#d1fae5', // emerald-100
          medium: '#d97706',       // amber-600
          'medium-subtle': '#fef3c7', // amber-100
          low: '#71717a',          // zinc-500
          'low-subtle': '#f4f4f5', // zinc-100
          destructive: '#dc2626',  // red-600
          'destructive-subtle': '#fef2f2', // red-50
        },

        // Track indicators
        'track': {
          'best-fit': '#059669',
          'best-fit-subtle': '#d1fae5',
          'simpler': '#71717a',
          'simpler-subtle': '#f4f4f5',
          'spark': '#7c3aed',
          'spark-subtle': '#ede9fe',
        },

        // Functional
        accent: '#18181b',         // Primary accent = near-black
        link: '#2563eb',           // Blue for links only
      },

      // ============================================
      // SPACING SCALE
      // 4px base unit, modular rhythm
      // ============================================
      spacing: {
        '0': '0',
        'px': '1px',
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '18': '72px',
        '20': '80px',
        '24': '96px',
        '28': '112px',
        '32': '128px',
      },

      // ============================================
      // BORDER RADIUS
      // ============================================
      borderRadius: {
        'none': '0',
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        'full': '9999px',
      },

      // ============================================
      // SHADOWS
      // Subtle, purposeful - not decorative
      // ============================================
      boxShadow: {
        'none': 'none',
        'sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'DEFAULT': '0 1px 3px rgba(0, 0, 0, 0.06)',
        'md': '0 2px 8px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.06)',
        'lg': '0 4px 12px rgba(0, 0, 0, 0.08), 0 16px 32px rgba(0, 0, 0, 0.08)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.06)',
      },

      // ============================================
      // MAX WIDTH
      // ============================================
      maxWidth: {
        'report': '1200px',
        'reading': '800px',
        'narrow': '640px',
      },

      // ============================================
      // TRANSITION
      // Weighted, purposeful - not playful
      // ============================================
      transitionDuration: {
        'fast': '150ms',
        'DEFAULT': '250ms',
        'slow': '400ms',
      },
      transitionTimingFunction: {
        'DEFAULT': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },

      // ============================================
      // LETTER SPACING
      // ============================================
      letterSpacing: {
        'tighter': '-0.03em',
        'tight': '-0.02em',
        'normal': '0',
        'wide': '0.05em',
        'wider': '0.1em',
        'widest': '0.15em',
      },

      // ============================================
      // LINE HEIGHT
      // ============================================
      lineHeight: {
        'tight': '1.2',
        'snug': '1.35',
        'normal': '1.5',
        'relaxed': '1.65',
        'loose': '1.8',
      },
    },
  },
  plugins: [],
};
