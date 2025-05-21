/**
 * @file WelcomeBanner.tsx
 * @description A client component that displays a personalized welcome banner to the user,
 * including their name, initials, and a call-to-action button.
 */
'use client';

import React, { useState, useEffect } from 'react';
import BrazeService from '@/lib/services/braze';

/** @component PlusIcon - SVG icon for 'Add' or 'New Order' actions. */
const PlusIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20"><path d="M10 5v10m-5-5h10" strokeLinejoin="round" strokeLinecap="round"/></svg>;

/**
 * @interface WelcomeBannerProps
 * @description Props for the WelcomeBanner component.
 */
interface WelcomeBannerProps {
  /** @property userName - The full name of the user to be displayed in the welcome message. */
  userName: string;
  /** @property userInitials - The initials of the user, displayed in a styled badge next to their name. */
  userInitials: string;
}

/**
 * @component WelcomeBanner
 * @description Displays a prominent welcome message to the user, typically at the top of a dashboard page.
 * It includes a personalized greeting with the user's name and initials, and a button to place a new order.
 * Features a full-bleed gradient background.
 * @param {WelcomeBannerProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered welcome banner element.
 */
const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ userName, userInitials }) => {
  const [buttonState, setButtonState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [buttonText, setButtonText] = useState('Place new order');

  useEffect(() => {
    let successTimer: NodeJS.Timeout;
    if (buttonState === 'loading') {
      setButtonText('Placing Order...');
    } else if (buttonState === 'success') {
      setButtonText('Order Placed ✓');
      successTimer = setTimeout(() => {
        setButtonState('idle');
      }, 2500); // Revert after 2.5 seconds
    } else { // idle
      setButtonText('Place new order');
    }
    return () => clearTimeout(successTimer);
  }, [buttonState]);

  return (
    <div className="bg-gradient-to-r from-banner-gradient-from to-banner-gradient-to text-white 
                    flex flex-col md:flex-row items-center justify-between 
                    py-3 px-8 md:py-0 md:h-24
                    -mt-4 sm:-mt-6 lg:-mt-8 /* Pulls it up against main content padding */
                    -mx-4 sm:-mx-6 lg:-mx-8 /* For full bleed */
                    mb-6 /* Space below the banner */
                    w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)] /* For full bleed */
                    shadow-md relative z-[5]">
      <div className="text-center md:text-left mb-4 md:mb-0 flex-1 pl-2">
        <h1 className="text-2xl md:text-[28px] font-light">
          Welcome, {userName}
          <span className="bg-brand-lime text-brand-green px-3 py-1 rounded-md font-semibold text-lg ml-3 align-middle">
            {userInitials}
          </span>
        </h1>
      </div>
      <button 
        className={`font-semibold px-4.5 py-2.5 rounded-md flex items-center justify-center gap-2 text-[15px] 
                           transition-all duration-300 ease-in-out md:w-auto md:m-0 z-[1] 
                           ${buttonState === 'success' 
                             ? 'bg-green-500 text-white shadow-md'
                             : buttonState === 'loading' 
                               ? 'bg-gray-300 text-gray-500 shadow-inner cursor-not-allowed'
                               : 'bg-[linear-gradient(135deg,#46fdae,#c6fb4b)] text-brand-green hover:opacity-90'}
                           focus:outline-none focus:ring-2 focus:ring-[#46fdae] focus:ring-opacity-50`}
        onClick={async () => {
          if (buttonState === 'loading' || buttonState === 'success') return;

          setButtonState('loading');
          await new Promise(resolve => setTimeout(resolve, 2000));

          if (BrazeService.isInitialized) {
            const eventProperties = {
              source_component: 'WelcomeBanner',
              order_status: 'success_simulated',
            };
            BrazeService.logCustomEvent('Order Placed', eventProperties);
            console.log('WelcomeBanner: Logged Braze event "Order Placed"', eventProperties);
          }
          setButtonState('success');
        }}
        disabled={buttonState === 'loading' || buttonState === 'success'}
      >
        <PlusIcon />
        <span>{buttonText}</span>
      </button>
    </div>
  );
};

export default WelcomeBanner;
