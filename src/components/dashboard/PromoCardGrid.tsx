/**
 * @file PromoCardGrid.tsx
 * @description A client component responsible for arranging and displaying multiple promotional card slots.
 * It uses a configuration to define slots and populates them with either Braze-sourced content or default content.
 */
'use client';

import React from 'react';
import PromoCardSlot from './PromoCardSlot';
import type { Card } from '@braze/web-sdk';
import { DefaultCardData } from '@/types/card'; // Removed unused isBrazeSDKCard import
import type { SlotConfig } from '@/types/card';

/**
 * @interface PromoCardGridProps
 * @description Props for the PromoCardGrid component.
 */
interface PromoCardGridProps {
  /** @property slotConfigs - An array of {@link SlotConfig} objects, defining each promotional slot in the grid. */
  slotConfigs: SlotConfig[];
  /** @property brazeCards - An array of Braze SDK Card objects or DefaultCardData objects. */
  brazeCards: (Card | DefaultCardData)[];
  /** @property brazeInitialized - A boolean flag indicating whether the Braze SDK has been initialized. */
  brazeInitialized: boolean;
}

/**
 * @component PromoCardGrid
 * @description Renders a grid of promotional card slots.
 * Each slot is configured via `slotConfigs` and can be populated by matching Braze cards or default content.
 * @param {PromoCardGridProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered grid of promo card slots, or a message if no slots are configured.
 */
const PromoCardGrid: React.FC<PromoCardGridProps> = ({ slotConfigs, brazeCards, brazeInitialized }) => {
  if (!slotConfigs || slotConfigs.length === 0) {
    return <div className="promo-cards-grid text-center p-4">No promo slots configured.</div>;
  }

  return (
    <div className="promo-cards-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-0 items-stretch">
      {slotConfigs.map(config => (
        <PromoCardSlot
          key={config.slotTargetKey || config.htmlElementId} // Ensure key is stable and unique
          slotTargetKey={config.slotTargetKey}
          defaultCardData={config.defaultCard}
          brazeCards={brazeCards}
          brazeInitialized={brazeInitialized}
          htmlElementId={config.htmlElementId} // Pass down for potential direct use or specific targeting
        />
      ))}
    </div>
  );
};

export type { DefaultCardData, SlotConfig }; // Export types for use in PromoCardSlot and dashboard page
export default PromoCardGrid;
