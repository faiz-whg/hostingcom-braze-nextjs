import * as brazeSDK from '@braze/web-sdk';

// Define interfaces for card data
export interface BrazeCardData {
  id: string;
  extras?: {
    image_url?: string;
    title_text?: string;
    description_text?: string;
    current_price?: string;
    original_price?: string;
    cta_text?: string;
    slot_target?: string;
  };
  imageUrl?: string; // Fallback if extras.image_url is not present
  title?: string;    // Fallback
  description?: string; // Fallback
  url?: string;      // CTA URL
  linkText?: string; // Fallback for cta_text
  openUrlInNewTab?: boolean;
  // Store the original Braze Card object for SDK operations
  _brazeOriginalCard?: brazeSDK.Card; // This will hold the original Braze SDK Card object
  // Allow any other properties from Braze SDK
  [key: string]: unknown; 
}

export interface SlotConfig {
  slotTargetKey: string;
  htmlElementId: string;
  defaultCard: DefaultCardData;
}

// This is an intentional placeholder interface that will be redefined below
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DefaultCardData {}

import type { Card } from '@braze/web-sdk';
export function isBrazeSDKCard(card: unknown): card is Card {
  return card !== null && 
    typeof card === 'object' && 
    'id' in card && 
    typeof (card as Record<string, unknown>).id === 'string' && 
    'extras' in card && 
    (card as Record<string, unknown>).extras !== undefined;
}

export interface DefaultCardData {
  id?: string;
  imageUrl: string;
  title: string;
  description: string;
  currentPrice?: string;
  originalPrice?: string;
  ctaText: string;
  ctaUrl?: string;
  openInNewTab?: boolean;
}

/**
 * Utility function to get the original Braze Card from our custom BrazeCardData
 * 
 * This function retrieves the original Braze SDK Card object stored in the _brazeOriginalCard property,
 * or falls back to a type assertion if the original is not available (though this may cause errors).
 */
export function getBrazeOriginalCard(card: BrazeCardData): brazeSDK.Card {
  // First check if we have the original card stored
  if (card._brazeOriginalCard) {
    return card._brazeOriginalCard as brazeSDK.Card;
  }
  
  // Fallback to type assertion, but this might not work if the card structure
  // doesn't match what the Braze SDK expects
  console.warn('Converting BrazeCardData without original card reference - may cause errors');
  return card as unknown as brazeSDK.Card;
}
