/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			'brand-green': '#0a3d2c',
  			'brand-green-darker': '#083325',
  			'brand-lime': '#aafa47',
  			'brand-lime-hover': '#98e63f',
  			'brand-gray': {
  				light: '#f8f9fa',
  				DEFAULT: '#f0f0f0',
  				dark: '#e0e0e0',
  				medium: '#ced4da',
  				text: '#333',
  				textMedium: '#555',
  				textLight: '#666',
  				textLighter: '#999',
  				textPlaceholder: '#6c757d'
  			},
  			'banner-gradient-from': '#2e4a45',
  			'banner-gradient-to': '#314945',
  			'feedback-bg': '#e6f9f0',
  			'hosting-card-gradient-from': '#aafa47',
  			'hosting-card-gradient-to': '#94f3d1',
  			'notification-dot': '#fa3e3e',
  			'status-active-bg': '#fff3cd',
  			'status-active-text': '#856404',
  			'popup-header-text': '#111',
  			
  		},
  		fontFamily: {
  			sans: [
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Arial',
  				'sans-serif'
  			]
  		},
  		boxShadow: {
  			header: '0 1px 3px rgba(0,0,0,0.05)',
  			dropdown: '0 4px 12px rgba(0,0,0,0.1)',
  			card: '0 2px 5px rgba(0,0,0,0.08)',
  			'card-hover': '0 5px 12px rgba(0,0,0,0.12)',
  			'btn-new-order': '0 2px 4px rgba(10,61,44,0.1)',
  			'btn-new-order-hover': '0 4px 8px rgba(10,61,44,0.15)',
  			'feature-card': '0 1px 3px rgba(0,0,0,0.05)',
  			'feature-card-hover': '0 4px 8px rgba(0,0,0,0.1)',
  			'chat-button': '0 4px 12px rgba(0,0,0,0.15)',
  			'chat-button-hover': '0 6px 16px rgba(0,0,0,0.2)',
  			'native-popup': '0 6px 16px rgba(0, 0, 0, 0.12)',
  			'hosting-card': '0 4px 12px rgba(0,0,0,0.08)',
  			'hosting-card-hover': '0 6px 16px rgba(0,0,0,0.12)'
  		},
  		spacing: {
  			'4.5': '1.125rem',
  			'5.5': '1.375rem'
  		},
  		borderRadius: {
  			'4xl': '2rem' // Keep custom ones if any, remove Shadcn specific radius vars
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
