'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import Header from '@/components/dashboard/Header';
import Sidebar from '@/components/dashboard/Sidebar';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import FeedbackAndHostingCards from '@/components/dashboard/FeedbackAndHostingCards';
import PromoCardGrid, { type SlotConfig, type DefaultCardData } from '@/components/dashboard/PromoCardGrid';
import type { Card } from '@braze/web-sdk';
import ProductListingSection from '@/components/dashboard/ProductListing/ProductListingSection';
import AdditionalCardsGrid from '@/components/dashboard/AdditionalCardsGrid';
import ChatButton from '@/components/dashboard/ChatButton';
import BrazeService from '@/lib/services/braze';
import { BRAZE_SUBSCRIPTION_GROUPS } from '@/config/brazeConfig'; 
// Add console log to debug and provide fallback value
const UPMIND_API_BASE_URL = process.env.NEXT_PUBLIC_UPMIND_API_BASE_URL;
console.log('[Debug] Dashboard UPMIND_API_BASE_URL:', UPMIND_API_BASE_URL);
// If UPMIND_API_BASE_URL is undefined, provide a fallback value
// This is just for debugging - you should keep using environment variables in production
const API_BASE = UPMIND_API_BASE_URL || 'https://api.upmind.io';

/**
 * @const defaultPromoCardsData
 * @description Default data for promotional cards, used as fallbacks if Braze Content Cards are not available for specific slots.
 * @type {DefaultCardData[]}
 */
const defaultPromoCardsData: DefaultCardData[] = [
    { id: 'default-email-hosting', imageUrl: '/images/email-office.png', title: 'Professional Email Hosting', description: 'Boost your brand with secure, custom email addresses.', currentPrice: '$5.99/mo', originalPrice: '$9.99/mo', ctaText: 'Explore Email Plans', ctaUrl: '#email-plans' },
    { id: 'default-ssl-certs', imageUrl: '/images/ssl-placeholder.png', title: 'SSL Certificates', description: 'Secure your website and build visitor trust.', currentPrice: '$49.99/yr', originalPrice: '$79.99/yr', ctaText: 'Get SSL Security', ctaUrl: '#ssl-certificates' },
    { id: 'default-ai-builder', imageUrl: '/images/ai-website-builder.png', title: 'AI Website Builder', description: 'Launch a stunning website in minutes, no coding needed.', currentPrice: 'Free Plan Available', ctaText: 'Build Your Site', ctaUrl: '#ai-website-builder' }
];

/**
 * @const threePromoCardSlotConfigs
 * @description Configuration for three promotional card slots, defining their target keys for Braze, default card data, and HTML element IDs.
 * @type {SlotConfig[]}
 */
const threePromoCardSlotConfigs: SlotConfig[] = [
    { slotTargetKey: 'before-products-promo-col-1', defaultCard: defaultPromoCardsData[0], htmlElementId: 'braze-slot-before-products-promo-col-1' },
    { slotTargetKey: 'before-products-promo-col-2', defaultCard: defaultPromoCardsData[1], htmlElementId: 'braze-slot-before-products-promo-col-2' },
    { slotTargetKey: 'before-products-promo-col-3', defaultCard: defaultPromoCardsData[2], htmlElementId: 'braze-slot-before-products-promo-col-3' },
];

/**
 * @interface UserInfo
 * @description Defines the structure for storing basic user information displayed on the dashboard.
 */
interface UserInfo {
  name: string;
  initials: string;
  email: string;
}

/**
 * @page DashboardPage
 * @description The main dashboard page for authenticated users. It displays user-specific information,
 * promotional content (including Braze Content Cards), product listings, and manages notification preferences.
 * It handles user authentication status, initializes Braze services, fetches and displays content cards,
 * and manages UI state for elements like the notification popup and mobile sidebar.
 * @returns {JSX.Element} The rendered dashboard page.
 */
export default function DashboardPage() {
  const { isAuthenticated, isLoadingAuth, logout, showNotificationOptIn, setShowNotificationOptIn } = useAuth();
  const router = useRouter();

  const uEmail = useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('userEmail') || '' : '', []);
  const uFirstName = useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('userFirstName') : null, []);
  const uLastName = useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('userLastName') : null, []);

  /** @state {UserInfo} userInfo - Stores the current user's display name, initials, and email. */
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: 'User', initials: 'XX', email: '' });
  /** @state {boolean} brazeInitialized - Tracks whether the Braze SDK has been successfully initialized. */
  const [brazeInitialized, setBrazeInitialized] = useState(BrazeService.isInitialized);
  /** @state {(Card | DefaultCardData)[]} allBrazeCards - Stores all content cards received from Braze. */
  const [allBrazeCards, setAllBrazeCards] = useState<(Card | DefaultCardData)[]>([]);
  /** @state {boolean} isNotificationPopupVisible - Controls the visibility of the notification opt-in popup. Now managed by AuthContext. */
  // Using AuthContext's showNotificationOptIn instead of local state
  /** @state {boolean} hasUnreadNotification - Indicates if there's an unread notification status (e.g., user hasn't opted-in), used to show a dot on the bell icon. */
  const [hasUnreadNotification, setHasUnreadNotification] = useState(false);
  /** @state {boolean} isMobileSidebarOpen - Controls the visibility of the sidebar on mobile devices. */
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  /**
   * @effect AuthCheckAndRedirect
   * @description Effect hook to check authentication status. If the user is not authenticated and authentication is not loading,
   * it redirects the user to the home page (`/`).
   * @deps `isAuthenticated`, `isLoadingAuth`, `router`
   */
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoadingAuth, router]);

  /**
   * @callback updateBellIconDotState
   * @description Updates the state `hasUnreadNotification` based on the `notification_opt_in_status`
   * stored in localStorage. This determines if a visual indicator (dot) should be shown on the notification bell icon.
   */
  const updateBellIconDotState = useCallback(() => {
    if (typeof window === 'undefined') return;
    const optInStatus = localStorage.getItem('notification_opt_in_status');
    setHasUnreadNotification(optInStatus !== 'subscribed');
  }, []);

  /**
   * @callback checkAndShowNotificationPopup
   * @description Checks conditions (localStorage opt-in status, dismissal timestamp) and decides whether to show the
   * notification opt-in popup. Can be triggered by a bell icon click or automatically.
   * @param {boolean} [isBellClick=false] - True if the check is triggered by a direct click on the notification bell.
   */
  const checkAndShowNotificationPopup = useCallback((isBellClick = false) => {
    console.log('Dashboard checkAndShowNotificationPopup called, isBellClick:', isBellClick);
    if (typeof window === 'undefined') return;
    
    const optInStatus = localStorage.getItem('notification_opt_in_status');
    console.log('Dashboard checkAndShowNotificationPopup: optInStatus:', optInStatus);
    
    if (optInStatus === 'subscribed') {
      console.log('Dashboard checkAndShowNotificationPopup: User already subscribed, hiding popup');
      setShowNotificationOptIn(false);
      updateBellIconDotState();
      return;
    }
    
    if (!isBellClick) {
      const dismissedTimestamp = localStorage.getItem('notification_opt_in_dismissed_timestamp');
      const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
      console.log('Dashboard checkAndShowNotificationPopup: dismissedTimestamp:', dismissedTimestamp);
      
      if (dismissedTimestamp && (Date.now() - parseInt(dismissedTimestamp || '0') < sevenDaysInMillis)) {
        console.log('Dashboard checkAndShowNotificationPopup: Recently dismissed, hiding popup');
        setShowNotificationOptIn(false);
        updateBellIconDotState();
        return;
      }
    }
    
    console.log('Dashboard checkAndShowNotificationPopup: Showing notification popup');
    setShowNotificationOptIn(true);
    updateBellIconDotState();
  }, [updateBellIconDotState, setShowNotificationOptIn]);

  /**
   * @effect UserInfoAndBrazeInitialization
   * @description This effect runs when the user is authenticated. It performs several actions:
   * 1. Sets up `userInfo` (name, initials, email) from localStorage.
   * 2. Checks Braze SDK initialization status.
   * 3. If Braze is initialized and user identifier (actor_id or email) is available:
   *    a. Calls `BrazeService.changeUser` to identify the user in Braze and set attributes.
   *    b. Subscribes to Braze Content Card updates and stores them in `allBrazeCards` state.
   *    c. Requests an initial refresh of content cards.
   * 4. Updates the notification bell icon's dot state.
   * 5. Schedules a check to potentially show the notification opt-in popup.
   * @returns {Function} A cleanup function that clears the popup timer and unsubscribes from Braze Content Card updates.
   * @deps `isAuthenticated`, `checkAndShowNotificationPopup`, `updateBellIconDotState`, `uEmail`, `uFirstName`, `uLastName`
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !isAuthenticated) return;

    let name = "User";
    let initials = "XX";

    if (uFirstName) {
      name = uFirstName;
      initials = uFirstName.substring(0, 1).toUpperCase();
      if (uLastName) initials += uLastName.substring(0, 1).toUpperCase();
      else if (uFirstName.length > 1) initials = uFirstName.substring(0, 2).toUpperCase();
    } else if (uEmail) {
      name = uEmail.split('@')[0];
      if (name && name.length > 1) initials = name.substring(0, 2).toUpperCase();
      else if (name && name.length === 1) initials = name.substring(0, 1).toUpperCase();
    }
    setUserInfo({ name, initials, email: uEmail });

    const initBrazeAndContent = async () => {
        // Braze initialization is now handled in AuthContext.tsx
        // We just check its status here if needed for other logic
        setBrazeInitialized(BrazeService.isInitialized);

        if (BrazeService.isInitialized) {
            const actorId = localStorage.getItem('actor_id') || uEmail;
            if (actorId) {
                const brazeUserAttributes: { email: string; firstName?: string; lastName?: string; } = { email: uEmail };
                if (uFirstName) brazeUserAttributes.firstName = uFirstName;
                if (uLastName) brazeUserAttributes.lastName = uLastName;
                
                BrazeService.changeUser(actorId, brazeUserAttributes);
                
                const subscriptionId = BrazeService.subscribeToContentCardsUpdates((contentCardsObject) => {
                    // Filter out cards with undefined id
                    const validCards = contentCardsObject.cards.filter(card => card.id !== undefined);
                    setAllBrazeCards(validCards);
                });
                BrazeService.requestContentCardsRefresh();
                // Return a cleanup function
                return () => {
                  if (typeof subscriptionId === 'string') {
                    // The BrazeService.unsubscribeFromContentCardsUpdates method internally checks for isInitialized and window
                    BrazeService.unsubscribeFromContentCardsUpdates(subscriptionId);
                  }
                };
            } else {
                 BrazeService.requestContentCardsRefresh();
            }
        }
    };
    
    let cleanupFunction: () => void = () => {};
    initBrazeAndContent().then(returnedCleanup => {
        if (typeof returnedCleanup === 'function') cleanupFunction = returnedCleanup;
    });

    updateBellIconDotState();
    // Delay popup check to ensure DOM is fully ready
    const timer = setTimeout(() => checkAndShowNotificationPopup(false), 100);

    return () => {
        clearTimeout(timer);
        if (typeof cleanupFunction === 'function') cleanupFunction();
    };
  }, [isAuthenticated, checkAndShowNotificationPopup, updateBellIconDotState, uEmail, uFirstName, uLastName ]);


  /**
   * @async
   * @callback handleNotificationOptInResponse
   * @description Handles the user's response (subscribed or dismissed) to the notification opt-in prompt.
   * - If subscribed: Sets `notification_opt_in_status` in localStorage, logs a Braze custom event,
   *   attempts to update Upmind opt-out settings via API to opt-in to all, and then updates Braze subscription groups.
   * - If dismissed: Sets `notification_opt_in_dismissed_timestamp` in localStorage and logs a Braze custom event.
   * Manages visibility of the popup and updates the bell icon dot state.
   * @param {boolean} subscribed - True if the user chose to subscribe, false if dismissed.
   */
  const handleNotificationOptInResponse = async (subscribed: boolean) => {
    if (typeof window === 'undefined') return;
    const actorId = localStorage.getItem('actor_id') || userInfo.email;
    const token = localStorage.getItem('access_token');

    if (subscribed) {
        localStorage.setItem('notification_opt_in_status', 'subscribed');
        if (BrazeService.isInitialized && actorId) {
            BrazeService.logCustomEvent('notification_subscribed');
        }

        if (token) {
            try {
                const upmindResponse = await fetch(`${API_BASE}/api/notifications/opt-outs`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ opt_outs: [] }),
                });
                if (!upmindResponse.ok) {
                    console.error("Failed to update Upmind opt-outs for 'Sign me up'. Status:", upmindResponse.status);
                } else {
                    console.log("Successfully opted-in to all Upmind notifications.");
                    if (BrazeService.isInitialized) {
                        const brazeSDKUpdates = {
                            [BRAZE_SUBSCRIPTION_GROUPS.MARKETING_EMAIL]: "subscribed" as "subscribed" | "unsubscribed",
                            [BRAZE_SUBSCRIPTION_GROUPS.MARKETING_IN_APP]: "subscribed" as "subscribed" | "unsubscribed",
                            [BRAZE_SUBSCRIPTION_GROUPS.SERVICE_UPDATES_EMAIL]: "subscribed" as "subscribed" | "unsubscribed",
                            [BRAZE_SUBSCRIPTION_GROUPS.SERVICE_UPDATES_IN_APP]: "subscribed" as "subscribed" | "unsubscribed",
                        };
                        await BrazeService.updateUserSubscriptionGroupsViaSDK(brazeSDKUpdates);
                        
                        // Log 'Notification Preference Updated' for bulk opt-in
                        const optedInBrazeGroups = Object.keys(brazeSDKUpdates);
                        const eventProperties = {
                            action_type: 'bulk_opt_in_via_popup',
                            updated_braze_subscription_groups_json: JSON.stringify(optedInBrazeGroups.map(groupId => ({ groupId, status: 'subscribed' }))),
                            number_of_changes: optedInBrazeGroups.length
                        };
                        BrazeService.logCustomEvent('Notification Preference Updated', eventProperties);
                        console.log("DashboardPage: Logged Braze event 'Notification Preference Updated' for bulk opt-in", eventProperties);
                    }
                }
            } catch (error) {
                console.error("Error during 'Sign me up' Upmind/Braze update:", error);
            }
        } else {
            console.warn("No token found, cannot update Upmind for 'Sign me up'.");
        }
    } else {
        localStorage.setItem('notification_opt_in_dismissed_timestamp', Date.now().toString());
        if (BrazeService.isInitialized && actorId) {
            BrazeService.logCustomEvent('notification_opt_in_dismissed');
        }
    }
    setShowNotificationOptIn(false);
    updateBellIconDotState();
  };
  
  const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);

  if (isLoadingAuth || !isAuthenticated) {
    // AuthProvider shows its own loading indicator, or HomePage shows one for initial auth.
    // If still loading or not authenticated, show a minimal loader or null if HomePage handles it.
    return <div className="flex items-center justify-center min-h-screen">Loading Dashboard...</div>; 
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-gray-light">
      <Header
        userInfo={userInfo}
        onLogout={logout} // from useAuth()
        onBellClick={() => {
            console.log('Dashboard: Bell icon clicked, current showNotificationOptIn:', showNotificationOptIn);
            // Simply toggle the popup state when bell is clicked
            setShowNotificationOptIn(!showNotificationOptIn);
        }}
        hasUnreadNotification={hasUnreadNotification}
        onToggleMobileSidebar={toggleMobileSidebar}
        isNotificationPopupVisible={showNotificationOptIn} // Pass state to Header
        onNotificationClose={() => handleNotificationOptInResponse(false)} // Pass handler
        onNotificationSignUp={() => handleNotificationOptInResponse(true)} // Pass handler
        onNotificationAskLater={() => handleNotificationOptInResponse(false)} // Pass handler
        notificationCount={hasUnreadNotification ? 1 : 0} // Added notificationCount
      />
      <div className="flex flex-1 pt-[60px]"> {/* Adjust pt based on actual Header height */} 
        <Sidebar 
            isMobileOpen={isMobileSidebarOpen} 
            toggleMobileSidebar={toggleMobileSidebar}
            onLogout={logout} // Pass logout to Sidebar as well if needed
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <WelcomeBanner userName={userInfo.name} userInitials={userInfo.initials} />
          
          {/* Two cards in a row after welcome banner */}
          <FeedbackAndHostingCards />

          <PromoCardGrid 
            slotConfigs={threePromoCardSlotConfigs} 
            brazeCards={allBrazeCards} 
            brazeInitialized={brazeInitialized} 
          />

          <ProductListingSection />
          
          {/* Placeholder for Braze In-App Message Content Cards - Bottom Slot */}
          {/* <div id="braze-slot-dashboard-bottom" className="mt-6"></div> */}

          <AdditionalCardsGrid />
          <ChatButton />
        </main>
      </div>
      {/* NotificationOptInPopup is now integrated into Header logic */}
    </div>
  );
}
