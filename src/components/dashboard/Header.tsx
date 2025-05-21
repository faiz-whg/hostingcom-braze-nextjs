/**
 * @file Header.tsx
 * @description Client component for the main application header.
 * Displays branding, navigation controls (like mobile sidebar toggle), user actions (profile dropdown, logout),
 * and notification indicators/popups.
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link'; // Changed from react-router-dom
import Image from 'next/image';
import NotificationOptInPopup from './NotificationOptInPopup'; // Assuming this will be .tsx
import type { AppBrazeCard } from '@/types/braze'; // Updated import path
import brazeService from '@/lib/services/braze';
import { type ContentCards, type Card as BrazeBaseCard } from '@braze/web-sdk'; // Added BrazeBaseCard for explicit casting

// --- SVG Icon Components ---
/** @component ClockIcon - SVG component for a clock icon (placeholder). */
const ClockIcon: React.FC = () => <svg className="w-6 h-6" stroke="currentColor" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
/** @component BellIconSvg - SVG component for a bell/notification icon. */
const BellIconSvg: React.FC = () => <svg className="w-6 h-6" stroke="currentColor" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
/** @component MoonIcon - SVG component for a moon icon (e.g., for dark mode toggle - placeholder). */
const MoonIcon: React.FC = () => <svg className="w-6 h-6" stroke="currentColor" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
/** @component MenuIcon - SVG component for a hamburger menu icon (mobile sidebar toggle). */
const MenuIcon: React.FC = () => <svg className="w-6 h-6" stroke="currentColor" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
// --- End SVG Icon Components ---

/**
 * @interface HeaderProps
 * @description Props for the Header component.
 */
interface HeaderProps {
  /** @property userInfo - Object containing basic user information (name, initials, email) for display. */
  userInfo: { name: string; initials: string; email: string; };
  /** @property onLogout - Callback function to be executed when the user clicks the logout button. */
  onLogout: () => void;
  /** @property onBellClick - Callback function to be executed when the notification bell icon is clicked. */
  onBellClick: () => void;
  /** @property hasUnreadNotification - Boolean indicating if there are unread notifications, to display an indicator on the bell icon. */
  hasUnreadNotification: boolean;
  /** @property onToggleMobileSidebar - Callback function to toggle the visibility of the mobile sidebar. */
  onToggleMobileSidebar: () => void;
  /** @property isNotificationPopupVisible - Boolean to control the visibility of the notification opt-in popup. (Note: Its role is reduced for the Braze-driven popup) */
  isNotificationPopupVisible: boolean;
  /** @property onNotificationClose - Callback function when the notification opt-in popup is closed. */
  onNotificationClose: () => void;
  /** @property onNotificationSignUp - Callback function when the user signs up for notifications via the opt-in popup. */
  onNotificationSignUp: () => void;
  /** @property onNotificationAskLater - Callback function when the user chooses 'Ask Later' in the notification opt-in popup. */
  onNotificationAskLater: () => void;
  /** @property notificationCount - The number of unread notifications (currently unused in UI, but prop exists). */
  notificationCount: number;
}

/**
 * @component Header
 * @description The main site header component.
 * It includes navigation, user profile access, logout functionality, and notification interactions.
 * @param {HeaderProps} props - The props for the Header component.
 * @returns {React.ReactElement} The rendered header element.
 */
const Header: React.FC<HeaderProps> = ({
  userInfo,
  onLogout,
  onBellClick,
  hasUnreadNotification,
  onToggleMobileSidebar,
  isNotificationPopupVisible,
  onNotificationClose,
  onNotificationSignUp,
  onNotificationAskLater
}) => {
  // State to manage the visibility of the user profile dropdown menu.
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  // Ref for the dropdown menu element, used to detect clicks outside for closing.
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Ref for the bell icon wrapper, potentially for positioning the notification popup (though popup is modal-like).
  const bellWrapperRef = useRef<HTMLDivElement>(null);

  // State for the actual Braze card object from the SDK
  const [activeBrazeBaseCard, setActiveBrazeBaseCard] = useState<BrazeBaseCard | null>(null);
  // State for the Braze card data shaped for the popup component
  const [popupContentCard, setPopupContentCard] = useState<AppBrazeCard | null>(null);
  // State to control actual visibility of the popup, considering Braze card and user actions
  const [isActualPopupVisible, setIsActualPopupVisible] = useState<boolean>(false);
  const hasLoggedNotificationImpressionRef = useRef<string | null>(null); // cardId of logged impression

  // Effect to handle clicks outside the dropdown menu to close it.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Effect to fetch and manage Braze content card for notification opt-in
  useEffect(() => {
    let isMounted = true;
    let unsubscribeId: string | undefined = undefined;

    const initializeBrazeAndSubscribe = async () => {
      try {
        // Wait for Braze to initialize if it hasn't already
        let attempts = 0;
        while (!brazeService.isInitialized && attempts < 20 && isMounted) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }

        if (!isMounted) return;

        if (!brazeService.isInitialized) {
          console.error('[Header] Braze service initialization timed out for notification popup card.');
          return;
        }

        const handleContentCardsUpdate = (contentCardsObject: ContentCards) => {
          if (!isMounted) return;

          const allSDKCards = contentCardsObject.cards as BrazeBaseCard[];
          const foundCard = allSDKCards.find(
            (card: BrazeBaseCard) => (card.extras as { slot_target?: string })?.slot_target === 'notification-optin-popup'
          );
          
          setActiveBrazeBaseCard(foundCard || null);
          // Cast the found SDK card to our AppBrazeCard type for the popup's props
          // This assumes the SDK card object will have the necessary fields (title, description, etc.)
          // based on the card type configured in Braze, matching AppBrazeCard structure.
          setPopupContentCard(foundCard ? (foundCard as unknown as AppBrazeCard) : null);

          if (foundCard) {
            console.log('[Header] Braze notification card found:', foundCard.id);
            // Check local storage to see if this specific card has been interacted with
            const dismissed = localStorage.getItem(`notificationPopupDismissed_${foundCard.id}`);
            const signedUp = localStorage.getItem(`notificationPopupSignedUp_${foundCard.id}`);
            const askLater = localStorage.getItem(`notificationPopupAskLater_${foundCard.id}`);

            if (!dismissed && !signedUp && !askLater) {
              setIsActualPopupVisible(true);
            } else {
              setIsActualPopupVisible(false); // Already interacted with
            }
          } else {
            console.log('[Header] No Braze notification card found for slot.');
            setIsActualPopupVisible(false); // No card, no popup
          }
        };

        // Initial fetch
        const initialCards = brazeService.getCachedContentCards();
        if (initialCards) {
          handleContentCardsUpdate(initialCards);
        }

        // Subscribe to updates
        unsubscribeId = brazeService.subscribeToContentCardsUpdates(handleContentCardsUpdate);

      } catch (error) {
        console.error('[Header] Error initializing Braze or subscribing for notification card:', error);
      }
    };

    initializeBrazeAndSubscribe();

    return () => {
      isMounted = false;
      if (unsubscribeId) {
        brazeService.unsubscribeFromContentCardsUpdates(unsubscribeId);
      }
    };
  }, []); // Run once on mount

  // Handle closing the popup
  const handlePopupClose = () => {
    setIsActualPopupVisible(false);
    if (activeBrazeBaseCard) {
      activeBrazeBaseCard.dismissCard(); // Use SDK method to dismiss
      localStorage.setItem(`notificationPopupDismissed_${activeBrazeBaseCard.id}`, 'true');
    }
    onNotificationClose(); // Call original handler if needed
  };

  const handlePopupSignUp = () => {
    setIsActualPopupVisible(false);
    if (activeBrazeBaseCard) {
      brazeService.logContentCardClick(activeBrazeBaseCard as BrazeBaseCard);
      localStorage.setItem(`notificationPopupSignedUp_${activeBrazeBaseCard.id}`, 'true');
    }
    onNotificationSignUp();
  };

  const handlePopupAskLater = () => {
    setIsActualPopupVisible(false);
    if (activeBrazeBaseCard) {
      localStorage.setItem(`notificationPopupAskLater_${activeBrazeBaseCard.id}`, 'true');
      // Optionally log a custom event to Braze for "Ask me later" if needed
      // e.g., brazeService.logCustomEvent('notification_popup_ask_later', { card_id: activeBrazeBaseCard.id });
    }
    onNotificationAskLater();
  };

  // Update isActualPopupVisible if the card changes (e.g. new card from Braze, or card removed)
  useEffect(() => {
    if (activeBrazeBaseCard) {
      const dismissed = localStorage.getItem(`notificationPopupDismissed_${activeBrazeBaseCard.id}`);
      const signedUp = localStorage.getItem(`notificationPopupSignedUp_${activeBrazeBaseCard.id}`);
      const askLater = localStorage.getItem(`notificationPopupAskLater_${activeBrazeBaseCard.id}`);
      
      if (!dismissed && !signedUp && !askLater) {
        setIsActualPopupVisible(true);
      } else {
        setIsActualPopupVisible(false);
      }
    } else {
      setIsActualPopupVisible(false); // No card, no popup
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBrazeBaseCard]); // Rerun when activeBrazeBaseCard changes

  // Determine if the popup should be rendered in the DOM
  // Render if we have content for the popup and it's currently set to be visible
  const shouldRenderPopup = !!popupContentCard && isActualPopupVisible;

  const handleBellIconClick = () => {
    // Call the original onBellClick prop for other potential notification systems
    onBellClick();

    // Option B: If the Braze card for the opt-in popup exists, always show the popup.
    if (activeBrazeBaseCard && activeBrazeBaseCard.id) {
      console.log(`[Header] Bell click: Forcing display of notification popup for card ${activeBrazeBaseCard.id}, ignoring localStorage flags.`);
      // To ensure it shows, we might also need to clear localStorage flags or ensure the effect that reads them re-evaluates.
      // Forcing isActualPopupVisible to true should be enough as shouldRenderPopup depends on it.
      // We can also clear the flags to make it like a fresh appearance if desired.
      // localStorage.removeItem(`notificationPopupDismissed_${activeBrazeBaseCard.id}`);
      // localStorage.removeItem(`notificationPopupSignedUp_${activeBrazeBaseCard.id}`);
      // localStorage.removeItem(`notificationPopupAskLater_${activeBrazeBaseCard.id}`);
      setIsActualPopupVisible(true); 
    } else {
      // If no specific card, perhaps the original onBellClick handles other general notifications.
      // console.log("[Header] Bell click: No active Braze notification card to show.");
    }
  };

  // Effect to log impression for the notification popup card
  useEffect(() => {
    if (shouldRenderPopup && popupContentCard && activeBrazeBaseCard && activeBrazeBaseCard.id) {
      if (hasLoggedNotificationImpressionRef.current !== activeBrazeBaseCard.id) {
        console.log(`[Header] Logging impression for notification card ID: ${activeBrazeBaseCard.id}`);
        brazeService.logContentCardImpression(activeBrazeBaseCard as BrazeBaseCard);
        hasLoggedNotificationImpressionRef.current = activeBrazeBaseCard.id;
      }
    } else if (!shouldRenderPopup) {
      // If popup is not rendered, reset the ref if the current card is no longer active
      // This allows re-logging if the same card appears again after being hidden for other reasons
      if (activeBrazeBaseCard && hasLoggedNotificationImpressionRef.current === activeBrazeBaseCard.id) {
        // Potentially too aggressive to reset here, consider if card transitions require this.
        // For now, let's assume a card disappearing and reappearing should log a new impression.
        // hasLoggedNotificationImpressionRef.current = null; 
      }
      // More simply, if there's no card, no impression can be logged or needs to be tracked.
      if (!activeBrazeBaseCard && hasLoggedNotificationImpressionRef.current) {
        hasLoggedNotificationImpressionRef.current = null;
      }
    }
  }, [shouldRenderPopup, popupContentCard, activeBrazeBaseCard]);

  return (
    <header className="bg-white border-b border-brand-gray-dark px-4 sm:px-6 py-3 flex justify-between items-center fixed top-0 left-0 right-0 z-30 shadow-header h-[60px]">
      <div className="flex items-center">
        <button onClick={onToggleMobileSidebar} className="md:hidden text-brand-gray-textLight hover:text-brand-green mr-3" aria-label="Toggle mobile sidebar">
            <MenuIcon />
        </button>
        <Link href="/dashboard" className="flex items-center text-lg font-semibold text-brand-gray-text hover:text-brand-green transition-colors pt-1">
          <div className="relative h-8 w-auto">
            <Image 
              src="/images/hosting-logo.png" 
              alt="hosting.com logo" 
              width={140} 
              height={32} 
              className="object-contain"
              style={{ height: '100%', width: 'auto' }}
              priority
            />
          </div>
        </Link>
      </div>

      <div className="flex items-center pr-1">
        <div className="flex items-center bg-gray-50 rounded-lg px-1 mr-2">
          <button className="flex items-center justify-center w-8 h-8 text-brand-gray-textLight hover:text-brand-green transition-colors" aria-label="Clock (placeholder)">
            <ClockIcon />
          </button>
          <button className="flex items-center justify-center w-8 h-8 text-brand-gray-textLight hover:text-brand-green transition-colors" aria-label="Toggle dark mode (placeholder)">
            <MoonIcon />
          </button>
          <div className="relative" ref={bellWrapperRef}>
            <button
              id="notificationBellIcon"
              onClick={handleBellIconClick}
              className="flex items-center justify-center w-8 h-8 text-brand-gray-textLight hover:text-brand-green transition-colors relative"
              aria-label={hasUnreadNotification ? "View notifications (unread)" : "View notifications"}
            >
              <BellIconSvg />
              {hasUnreadNotification && (
                <span className="absolute top-0 right-0 block w-2.5 h-2.5 bg-notification-dot rounded-full border border-white pointer-events-none" aria-hidden="true"></span>
              )}
            </button>
            {shouldRenderPopup && (
              <NotificationOptInPopup
                isVisible={true} // Controls animation; actual rendering is controlled by shouldRenderPopup
                onClose={handlePopupClose}
                onSignUp={handlePopupSignUp}
                onAskLater={handlePopupAskLater}
                animationStyle="rise"
                brazeCard={popupContentCard} // Pass the data shaped for the popup
              />
            )}
          </div>
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="bg-brand-lime text-brand-green px-3 py-1.5 rounded-md font-semibold text-sm uppercase transition-all hover:bg-brand-lime-hover hover:-translate-y-px focus:outline-none min-w-[40px] text-center"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label={`User menu for ${userInfo.initials}`}
          >
            {userInfo.initials}
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-brand-gray-dark rounded-md shadow-dropdown z-40 overflow-hidden py-1" role="menu">
              <Link
                href="/notification-preferences"
                onClick={() => setDropdownOpen(false)}
                className="block px-4 py-2 text-sm text-brand-gray-text hover:bg-brand-gray hover:text-brand-green whitespace-nowrap" 
                role="menuitem"
              >
                Notification Preferences
              </Link>
              <a
                href="#"
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); onLogout(); setDropdownOpen(false); }}
                className="block px-4 py-2 text-sm text-brand-gray-text hover:bg-brand-gray hover:text-brand-green whitespace-nowrap"
                role="menuitem"
              >
                Logout
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
