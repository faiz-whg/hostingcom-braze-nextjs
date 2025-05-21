/**
 * @file FeatureCard.tsx
 * @description A client component that displays a feature or information in a card format,
 * typically used in a dashboard or features section.
 */
'use client';

import React from 'react';

/**
 * @component ArrowRightBtn
 * @description A simple button component displaying a right arrow, typically used for navigation or indicating action.
 * @returns {React.ReactElement} The rendered arrow button.
 */
const ArrowRightBtn: React.FC = () => (
  <button 
    className="ml-auto bg-white border border-brand-gray-dark w-8 h-8 rounded-full 
               cursor-pointer shadow-sm flex items-center justify-center text-lg text-brand-gray-text 
               transition-all duration-200 flex-shrink-0
               hover:translate-x-0.5 hover:scale-105 hover:shadow-md hover:bg-gray-50"
    aria-label="Go to feature"
  >
    →
  </button>
);

/**
 * @interface FeatureCardProps
 * @description Props for the FeatureCard component.
 */
interface FeatureCardProps {
  /** @property icon - The React node (typically an SVG icon) to be displayed in the card. */
  icon: React.ReactNode;
  /** @property iconBgClass - The Tailwind CSS background color class for the icon container (e.g., 'bg-blue-100'). */
  iconBgClass: string;
  /** @property title - The title text of the feature card. */
  title: string;
  /** @property description - The descriptive text for the feature card. */
  description: string;
  // Optional: Add if the card itself should be clickable
  // onClick?: () => void;
  // href?: string; // If it's a link, consider wrapping with Next/Link
}

/**
 * @component FeatureCard
 * @description Displays a single feature or piece of information in a card format.
 * Includes an icon, title, description, and a right arrow button.
 * The card has hover effects for visual feedback.
 * @param {FeatureCardProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered feature card element.
 */
const FeatureCard: React.FC<FeatureCardProps> = ({ icon, iconBgClass, title, description }) => {
  // const handleClick = () => {
  //   if (onClick) onClick();
  //   // if (href) router.push(href); // If using Next/Link or router
  // };

  return (
    <div 
      className="bg-white p-5 rounded-lg shadow-feature-card 
                 transition-all duration-200 cursor-pointer 
                 flex items-center gap-4 
                 hover:-translate-y-0.5 hover:shadow-feature-card-hover"
      // onClick={handleClick} // Add if card is clickable
      // role={onClick || href ? "button" : undefined} // Accessibility
      // tabIndex={onClick || href ? 0 : undefined} // Accessibility
    >
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBgClass}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg text-brand-gray-text mb-1 font-semibold">{title}</h3>
        <p className="text-brand-gray-textLight leading-normal text-sm">{description}</p>
      </div>
      <ArrowRightBtn />
    </div>
  );
};

export default FeatureCard;
