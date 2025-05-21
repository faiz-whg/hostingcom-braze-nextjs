import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        // Example: Add your brand colors here
        'brand-lime': '#AFFF00',
        'brand-green': '#004D2B',
        'brand-gray-text': '#333333',
        'brand-gray-textLight': '#555555',
        'brand-gray-textMedium': '#777777',
        'brand-gray-light': '#F0F0F0',
        'brand-gray-dark': '#DDDDDD',
        // Status colors (ensure these match your usage in components)
        'status-active-bg': '#E6F7F0', // Light green for active status background
        'status-active-text': '#00875A', // Darker green for active status text
        'status-warning-bg': '#FFFBE6',  // Light yellow for warning
        'status-warning-text': '#FAAD14', // Darker yellow for warning text
        'status-error-bg': '#FFF1F0',    // Light red for error
        'status-error-text': '#FF4D4F',  // Darker red for error text
        'status-info-bg': '#E6F7FF',     // Light blue for info
        'status-info-text': '#1890FF',   // Darker blue for info text
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
      boxShadow: {
        'feature-card': '0px 4px 20px 0px rgba(0, 0, 0, 0.05)',
        'subtle': '0px 2px 10px 0px rgba(0,0,0,0.03)',
      }
      // You can extend other theme properties like spacing, borderRadius, etc.
    },
  },
  plugins: [],
};
export default config;
