/**
 * @file PromoCard.tsx
 * @description A client component that displays a promotional card. It can render content
 * sourced from Braze (Content Cards) or from a default local data structure.
 * Includes click tracking for Braze-sourced cards.
 */
'use client';

import React from 'react';
import Image from 'next/image';
import brazeService from '@/lib/services/braze';
import { Card } from '@braze/web-sdk';
import { DefaultCardData } from '@/types/card';

/**
 * @component ArrowRightIcon
 * @description SVG icon component displaying a right arrow, used in the CTA button of the PromoCard.
 * @returns {React.ReactElement} The rendered SVG arrow icon.
 */
const ArrowRightIcon: React.FC = () => (
  <svg className="w-4 h-4 ml-2 stroke-current" fill="none" strokeWidth="2" viewBox="0 0 16 16">
    <path d="M1 8h12M9 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Props definition using a discriminated union based on the card source.

/**
 * @typedef PromoCardProps
 * @description Props for the PromoCard component, using a discriminated union to handle different card data sources.
 */
type PromoCardProps = 
  | { isBrazeSourced: true; card: Card }
  | { isBrazeSourced: false; card: DefaultCardData };

/**
 * @component PromoCard
 * @description Renders a promotional card with an image, title, description, optional pricing, and a call-to-action.
 * Adapts its content based on whether the data is sourced from Braze or a default structure.
 * Logs clicks to Braze for Braze-sourced cards.
 * @param {PromoCardProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered promotional card.
 */
const PromoCard: React.FC<PromoCardProps> = (props) => {
  const { isBrazeSourced, card } = props;

  // --- Card Data Extraction ---

  // Extract and normalize card data based on source (Braze or default)
  let id: string;
  let imageUrl: string;
  let title: string;
  let description: string;
  let currentPrice: string | undefined;
  let originalPrice: string | undefined;
  let ctaText: string;
  let ctaUrl: string;
  let openInNewTab: boolean;

  if (isBrazeSourced) {
    // Data from Braze SDK Card object
    // card is Card from Braze SDK
    id = card.id || 'braze-card'; // Handle potential undefined
    
    // Access properties safely from extras
    const extras = card.extras || {};
    // Use type assertion with Record<string, unknown> instead of 'any'
    // First cast to unknown, then to Record<string, unknown> to avoid TypeScript errors
    const cardAsRecord = card as unknown as Record<string, unknown>;
    imageUrl = extras.image_url || (cardAsRecord.imageUrl as string) || 'https://via.placeholder.com/400x225.png/CCCCCC/FFFFFF?Text=Service';
    title = extras.title_text || (cardAsRecord.title as string) || 'Exciting Offer';
    description = extras.description_text || (cardAsRecord.description as string) || 'Learn more about this great service.';
    currentPrice = extras.current_price;
    originalPrice = extras.original_price;
    ctaText = extras.cta_text || (cardAsRecord.linkText as string) || 'Learn More';
    ctaUrl = (cardAsRecord.url as string) || '#';
    openInNewTab = (cardAsRecord.openUrlInNewTab as boolean) || false;
  } else {
    // Data from local/default source (DefaultCardData)
    // card is DefaultCardData
    id = card.id || `default-card-${Math.random().toString(36).substring(2, 9)}`;
    imageUrl = card.imageUrl;
    title = card.title;
    description = card.description;
    currentPrice = card.currentPrice;
    originalPrice = card.originalPrice;
    ctaText = card.ctaText;
    ctaUrl = card.ctaUrl || '#';
    openInNewTab = card.openInNewTab || false;
  }

  /**
   * @function handleCtaClick
   * @description Handles the click event on the Call-to-Action (CTA) link.
   * If the card is Braze-sourced, it logs the click event using the Braze service.
   * Prevents default navigation if ctaUrl is '#' or empty.
   * @param {React.MouseEvent<HTMLAnchorElement>} e - The mouse event.
   */
  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isBrazeSourced && card) {
      // Card is already a Braze SDK Card instance
      brazeService.logContentCardClick(card); 
      console.log(`PromoCard: Logged Braze native content card click for ID: ${card.id}`);
    } else if (!isBrazeSourced && card) {
      // Card is DefaultCardData
      const defaultCard = card as DefaultCardData;
      const eventProperties = {
        card_id: defaultCard.id || `default-card-${Math.random().toString(36).substring(2, 9)}`,
        card_title: defaultCard.title,
        card_description: defaultCard.description,
        cta_text: defaultCard.ctaText,
        cta_url: defaultCard.ctaUrl !== undefined ? defaultCard.ctaUrl : null,
        image_url: defaultCard.imageUrl,
        current_price: defaultCard.currentPrice !== undefined ? defaultCard.currentPrice : null,
        original_price: defaultCard.originalPrice !== undefined ? defaultCard.originalPrice : null,
        is_default_card: true
      };
      brazeService.logCustomEvent('Content Card Clicked', eventProperties as Record<string, string | number | boolean | Date | null>);
      console.log(`PromoCard: Logged custom event 'Content Card Clicked' for default card ID: ${eventProperties.card_id}`);

      // Add 'Order Placed' event for default card CTA clicks (simulated)
      const orderPlacedProperties = {
        source_component: 'PromoCard',
        card_id: defaultCard.id || `default-card-${Math.random().toString(36).substring(2, 9)}`,
        card_title: defaultCard.title,
        cta_text: defaultCard.ctaText,
        order_status: 'success_simulated',
      };
      brazeService.logCustomEvent('Order Placed', orderPlacedProperties as Record<string, string | number | boolean | Date | null>);
      console.log(`PromoCard: Logged custom event 'Order Placed' for default card ID: ${orderPlacedProperties.card_id}`);
    }

    if (ctaUrl === '#' || !ctaUrl) {
      e.preventDefault();
    }
  };

  const cardHeight = "h-[350px]";
  const imageHeightProportion = "h-[45%]";
  const contentHeightProportion = "h-[55%]";

  return (
    <div
      id={id}
      className={`bg-white rounded-xl shadow-card overflow-hidden flex flex-col ${cardHeight} w-full transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-card-hover`}
    >
      <div className={`${imageHeightProportion} w-full relative bg-gray-100 overflow-hidden rounded-t-xl`}>
        <Image 
            src={imageUrl} 
            alt={title} 
            fill // Replaces layout="fill"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={imageUrl.includes('ssl-placeholder')} // Add priority for LCP image
            className="absolute top-0 left-0 w-full h-full object-cover" // Added object-cover
        />
      </div>

      <div className={`${contentHeightProportion} p-5 flex flex-col`}>
        <h3 className="text-lg font-semibold text-brand-gray-text mb-2 leading-tight line-clamp-2">
            {title}
        </h3>
        
        <p className="text-sm text-brand-gray-textMedium leading-relaxed mb-2 flex-grow line-clamp-3 md:line-clamp-3 overflow-hidden"> 
            {description}
        </p>
        
        {(currentPrice || originalPrice) && (
          <div className="mb-3 leading-none">
            {currentPrice && <span className="text-lg font-bold text-brand-green mr-2">{currentPrice}</span>}
            {originalPrice && <span className="text-sm text-gray-400 line-through">{originalPrice}</span>}
          </div>
        )}

        <a
          href={ctaUrl}
          target={openInNewTab ? '_blank' : '_self'}
          rel={openInNewTab ? 'noopener noreferrer' : undefined}
          onClick={handleCtaClick}
          className="mt-auto inline-flex items-center text-brand-green font-semibold text-[15px] transition-colors hover:text-brand-lime-hover group"
        >
          {ctaText}
          <ArrowRightIcon />
        </a>
      </div>
    </div>
  );
};

export default PromoCard;
