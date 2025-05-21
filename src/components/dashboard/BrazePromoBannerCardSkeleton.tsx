/**
 * @file BrazePromoBannerCardSkeleton.tsx
 * @description A client component that renders a skeleton placeholder, visually mimicking the BrazePromoBannerCard layout.
 * It's used to indicate a loading state before actual banner content is available.
 */
'use client';

import React from 'react';

/**
 * @component BrazePromoBannerCardSkeleton
 * @description Renders a skeleton loading card with a layout similar to the `BrazePromoBannerCard`.
 * It features an image placeholder on the left and content placeholders on the right,
 * all with a pulsing animation. The card maintains a fixed height consistent with `BrazePromoBannerCard`.
 * @returns {React.ReactElement} The rendered skeleton banner card element.
 */
const BrazePromoBannerCardSkeleton: React.FC = () => {
  return (
    <div 
      className="relative bg-[#d5ffee] rounded-lg shadow-card overflow-hidden h-[140px] w-full animate-pulse flex"
    >
      {/* Image Placeholder (Left) */}
      <div className="h-full aspect-square bg-black/[0.06] flex items-center justify-center">
        <div className="w-[calc(100%-16px)] h-[calc(100%-16px)] bg-white/40 rounded"></div>
      </div>
      
      {/* Content Placeholder (Right) */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        {/* Text lines group */}
        <div className="space-y-2">
          {/* Title */}
          <div className="h-4 bg-white/40 rounded w-3/4"></div>
          {/* Description */}
          <div className="h-3 bg-white/40 rounded w-full"></div>
          <div className="h-3 bg-white/40 rounded w-5/6"></div>
        </div>
        
        {/* Button Placeholder */}
        <div className="mt-2">
          <div className="h-8 bg-white/40 rounded w-1/3"></div>
        </div>
      </div>

      {/* Navigation Controls Placeholder */}
      <div className="absolute top-2 right-2 flex space-x-1">
        <div className="w-7 h-7 rounded-full bg-white/40"></div>
        <div className="w-7 h-7 rounded-full bg-white/40"></div>
      </div>
    </div>
  );
};

export default BrazePromoBannerCardSkeleton;
