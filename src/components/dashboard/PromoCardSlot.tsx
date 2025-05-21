/**
 * @file PromoCardSlot.tsx
 * @description A client component that manages and renders a single promotional card slot.
 * It determines whether to display content from Braze (via props or cache), default content,
 * or remain empty, and handles loading states and impression logging for Braze cards.
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import PromoCard from './PromoCard';
import SkeletonCard from './SkeletonCard';
import brazeService from '@/lib/services/braze';
import { Card } from '@braze/web-sdk';
import { DefaultCardData, isBrazeSDKCard } from '@/types/card'; // Import types from shared file

/**
 * @constant BRAZE_DATA_TIMEOUT_MS
 * @description Timeout in milliseconds to wait for Braze data before falling back to default content.
 */
const BRAZE_DATA_TIMEOUT_MS = 3000;

/**
 * @interface PromoCardSlotProps
 * @description Props for the PromoCardSlot component.
 */
interface PromoCardSlotProps {
  slotTargetKey: string;
  defaultCardData: DefaultCardData | null;
  brazeCards: (Card | DefaultCardData)[];
  brazeInitialized: boolean;
  htmlElementId: string;
}

/**
 * @typedef SlotStatus
 * @description Represents the possible display states of the promo card slot.
 * - `loading`: The slot is currently determining which card to display.
 * - `braze`: A Braze card is being displayed.
 * - `default`: A default card is being displayed.
 * - `empty`: No card is available or configured for display.
 */
type SlotStatus = 'loading' | 'braze' | 'default' | 'empty';

/**
 * @component PromoCardSlot
 * @description Manages the content of a single promotional card slot. It prioritizes Braze cards
 * (from props or cache), then falls back to default card data, or an empty state.
 * Shows a skeleton loader while determining content and logs impressions for Braze cards.
 * @param {PromoCardSlotProps} props - The props for the component.
 * @returns {React.ReactElement | null} The rendered promo card slot, or null if configured to be empty.
 */
const PromoCardSlot: React.FC<PromoCardSlotProps> = ({
  // Destructure props for clarity 
  slotTargetKey, 
  defaultCardData, 
  brazeCards, 
  brazeInitialized, 
  htmlElementId 
}) => {
  /** @state status - The current display status of the slot (loading, braze, default, empty). */
  const [status, setStatus] = useState<SlotStatus>('loading');
  /** @state cardToDisplay - The card data to display in this slot. */
  const [cardToDisplay, setCardToDisplay] = useState<Card | DefaultCardData | null>(null);
  /** @ref dataFetchTimeoutRef - Ref to store the timeout ID for Braze data fetching fallback. */
  const dataFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  /** @ref hasLoggedImpressionRef - Ref to track if an impression has already been logged for the current Braze card to prevent duplicates. */
  const hasLoggedImpressionRef = useRef<boolean>(false);

  /**
   * @effect Effect to determine which card to display (Braze, default, or empty).
   * This effect runs when slot configuration, Braze data, or initialization status changes.
   * It prioritizes:
   * 1. Braze card from `brazeCards` prop if `slotTargetKey` matches.
   * 2. Braze card from Braze SDK cache if `slotTargetKey` matches (after a timeout if not found in props).
   * 3. `defaultCardData` if no Braze card is found or Braze is not initialized.
   * 4. Empty state if `defaultCardData` is also null.
   */
  useEffect(() => {
    setStatus('loading'); 
    setCardToDisplay(null);
    hasLoggedImpressionRef.current = false;

    if (dataFetchTimeoutRef.current) clearTimeout(dataFetchTimeoutRef.current);

    if (!brazeInitialized) {
      const timer = setTimeout(() => {
        setCardToDisplay(defaultCardData);
        setStatus(defaultCardData ? 'default' : 'empty');
      }, 50); 
      return () => clearTimeout(timer);
    }

    const cardFromProps = (brazeCards || []).find(
      (bc) => isBrazeSDKCard(bc) && bc.extras?.slot_target === slotTargetKey
    );

    if (cardFromProps && isBrazeSDKCard(cardFromProps)) {
      setCardToDisplay(cardFromProps);
      setStatus('braze');
    } else {
      dataFetchTimeoutRef.current = setTimeout(() => {
        const cachedBrazeSDKResult = brazeService.getCachedContentCards();
        
        // Handle the case where cachedBrazeSDKResult might be undefined
        if (cachedBrazeSDKResult && cachedBrazeSDKResult.cards) {
          // Use the Card objects directly from the cache
          const cardsFromCache = (cachedBrazeSDKResult.cards || [])
            .filter(card => card.id !== undefined);

          const cardFromCache = cardsFromCache.find(bc => bc.extras?.slot_target === slotTargetKey);

          if (cardFromCache) {
            setCardToDisplay(cardFromCache);
            setStatus('braze');
            return;
              setStatus('braze');
              return;
          }
        }
        
        // If we get here, either no cached results or no matching card
        setCardToDisplay(defaultCardData);
        setStatus(defaultCardData ? 'default' : 'empty');
      }, BRAZE_DATA_TIMEOUT_MS);
    }
    
    return () => {
        if (dataFetchTimeoutRef.current) clearTimeout(dataFetchTimeoutRef.current);
    };

  }, [slotTargetKey, defaultCardData, brazeCards, brazeInitialized, htmlElementId]);

  /**
   * @effect Effect to log an impression when a Braze card is displayed.
   * Ensures impression is logged only once per card display.
   */
  useEffect(() => {
    if (status === 'braze' && cardToDisplay && !hasLoggedImpressionRef.current) {
      // Check if it's a proper Card instance from Braze SDK
      if (cardToDisplay instanceof Card) {
        console.log('[DEBUG] Logging impression for card:', cardToDisplay, 'Is instanceof Card:', cardToDisplay instanceof Card);
        brazeService.logContentCardImpression(cardToDisplay);
        hasLoggedImpressionRef.current = true;
      } else {
        console.error('[ERROR] Not a valid Braze Card instance:', cardToDisplay);
        console.error('Constructor:', cardToDisplay && cardToDisplay.constructor && cardToDisplay.constructor.name);
      }
    }
  }, [status, cardToDisplay]);

  let slotClass = 'braze-content-card-slot';
  if (status === 'loading' || (status === 'braze' && cardToDisplay) || (status === 'default' && cardToDisplay)) {
    slotClass += ' populated'; 
  }

  return (
    <div id={htmlElementId} className={slotClass}>
      {status === 'loading' && <SkeletonCard />}
      {status === 'braze' && cardToDisplay && cardToDisplay instanceof Card && (
        <PromoCard card={cardToDisplay} isBrazeSourced={true} />
      )}
      {status === 'default' && cardToDisplay && !(cardToDisplay instanceof Card) && (
        <PromoCard card={cardToDisplay as DefaultCardData} isBrazeSourced={false} />
      )}
      {/* No explicit 'empty' state rendering beyond the base slotClass styles */}
    </div>
  );
};

export default PromoCardSlot;
