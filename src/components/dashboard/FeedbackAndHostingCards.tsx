/**
 * @file FeedbackAndHostingCards.tsx
 * @description A client component that displays two cards in a row after the welcome banner.
 * These cards provide feedback options and hosting management information.
 */
'use client';

import React from 'react';
import BrazePromoBannerCard from './BrazePromoBannerCard';

/**
 * @component HeartIcon
 * @description SVG icon representing a heart for the feedback card.
 * @returns {React.ReactElement} The rendered SVG icon.
 */
const HeartIcon: React.FC = () => (
  <svg className="w-6 h-6 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


/**
 * @component ArrowRightIcon
 * @description SVG icon representing a right arrow for the card links.
 * @returns {React.ReactElement} The rendered SVG icon.
 */
const ArrowRightIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * @component FeedbackAndHostingCards
 * @description Displays two cards in a row: a feedback card and a hosting management card.
 * @returns {React.ReactElement} The rendered cards.
 */
const FeedbackAndHostingCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 px-0">
      {/* Feedback Card */}
      <div className="bg-[#d5ffee] rounded-lg p-4 flex items-start shadow-card transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-card-hover">
        <div className="w-12 h-12 rounded-lg bg-black/[0.06] flex items-center justify-center flex-shrink-0 mr-4 p-2.5">
          <HeartIcon />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium mb-1">Hey, got a second?</h3>
          <p className="text-sm text-gray-600 mb-0">
            We&apos;d really love to hear from you. What did you like? What could we do better? Your feedback will help shape what we do - and it will only take a minute.
          </p>
        </div>
        <a 
          href="#feedback" 
          className="ml-2 w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm hover:shadow transition-all duration-200 hover:scale-105"
          aria-label="Give feedback"
        >
          <ArrowRightIcon />
        </a>
      </div>

      {/* Braze Promo Banner Card Slot */}
      <BrazePromoBannerCard slotId="promo-banner" />
    </div>
  );
};

export default FeedbackAndHostingCards;
