/**
 * @file NotificationOptInPopup.tsx
 * @description A client component that renders a popup encouraging users to opt-in to notifications.
 * It appears automatically after login and can be triggered by clicking the bell icon.
 * Features smooth entrance and exit animations.
 */
'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * @interface NotificationOptInPopupProps
 * @description Props for the NotificationOptInPopup component.
 */
interface NotificationOptInPopupProps {
  /** @property isVisible - Controls the visibility of the popup. If true, the popup is displayed. */
  isVisible: boolean;
  /** @property onClose - Callback function executed when the popup is closed (e.g., by clicking outside or the close button). */
  onClose: () => void;
  /** @property onSignUp - Callback function executed when the user clicks the 'Sign me up' button. */
  onSignUp: () => void;
  /** @property onAskLater - Callback function executed when the user clicks the 'Ask me later' button. */
  onAskLater: () => void;
  /** @property animationStyle - Optional animation style for the popup entrance. */
  animationStyle?: 'fade' | 'slide' | 'bounce' | 'scale' | 'rise';
}

/**
 * @component NotificationOptInPopup
 * @description A popup component that prompts users to opt-in for notifications.
 * It includes options to sign up, ask later, or close the popup.
 * The popup is designed to appear near the notification bell icon and handles outside clicks to close.
 * Features enhanced animations for a better user experience.
 * @param {NotificationOptInPopupProps} props - The props for the component.
 * @returns {React.ReactElement | null} The rendered popup element or null if not visible.
 */
const NotificationOptInPopup: React.FC<NotificationOptInPopupProps> = ({ 
  isVisible, 
  onClose, 
  onSignUp, 
  onAskLater,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  animationStyle = 'bounce' // Keeping this prop for future customization options
}) => {
  // Ref for the popup DOM element, used for detecting clicks outside.
  const popupRef = useRef<HTMLDivElement>(null);
  // State to manage animation phases (entering, visible, exiting)
  const [animationState, setAnimationState] = useState<'hidden' | 'entering' | 'visible' | 'exiting'>('hidden');

  // Animation state management with bounce effect
  useEffect(() => {
    console.log('NotificationOptInPopup: isVisible changed to', isVisible);
    
    if (isVisible) {
      // First set to entering state to start the animation
      setAnimationState('entering');
      
      // Then quickly transition to visible state to complete the bounce
      const timer = setTimeout(() => {
        setAnimationState('visible');
      }, 20); // Very short delay to ensure animation starts properly
      
      return () => clearTimeout(timer);
    } else {
      // When hiding, immediately start exit animation
      setAnimationState('exiting');
      
      // Set a short timeout to fully hide after animation completes
      const timer = setTimeout(() => {
        setAnimationState('hidden');
      }, 200); // Short duration for responsive feel
      
      return () => clearTimeout(timer);
    }
  }, [isVisible]); // Only depend on isVisible for simpler logic

  // Effect to handle clicks outside the popup to close it.
  // It also checks if the click was on the notification bell icon to prevent immediate re-closing.
  useEffect(() => {
    if (animationState !== 'visible') return;

    const handleClickOutside = (event: MouseEvent) => {
      const bellButton = document.getElementById('notificationBellIcon');
      if (popupRef.current && 
          !popupRef.current.contains(event.target as Node) &&
          (!bellButton || !bellButton.contains(event.target as Node))) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [animationState, onClose]);

  // Only render when visible or becoming visible
  if (animationState === 'hidden') return null;

  // Animation styles with bounce effect for better visual feedback
  const getAnimationStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      top: 'calc(100% + 10px)',
      right: '-29px',
      width: '330px',
      maxWidth: 'calc(100vw - 40px)',
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', // Enhanced shadow for better visibility
      border: '1px solid #e0e0e0',
      zIndex: 50,
      pointerEvents: animationState === 'visible' ? 'auto' : 'none',
    };
    
    // Animation states for the bounce effect
    let animationStyles: React.CSSProperties = {};
    
    if (animationState === 'entering') {
      // Initial state - slightly above final position and smaller
      animationStyles = {
        opacity: 0.7,
        transform: 'translateY(-10px) scale(0.95)',
        transition: 'transform 250ms cubic-bezier(0.18, 1.25, 0.4, 1.1), opacity 250ms ease-out',
      };
    } else if (animationState === 'visible') {
      // Final state - bounce to final position
      animationStyles = {
        opacity: 1,
        transform: 'translateY(0) scale(1)',
        transition: 'transform 250ms cubic-bezier(0.18, 1.25, 0.4, 1.1), opacity 250ms ease-out',
      };
    } else if (animationState === 'exiting') {
      // Exit state - quick fade out
      animationStyles = {
        opacity: 0,
        transform: 'translateY(-5px) scale(0.98)',
        transition: 'transform 200ms ease-out, opacity 200ms ease-out',
      };
    }
    
    // Combine base styles with animation styles
    return { ...baseStyles, ...animationStyles };
  };

  return (
    <div
      ref={popupRef}
      style={getAnimationStyles()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-popup-title"
      className="notification-optin-popup"
    >
      {/* Custom arrow pointing to bell icon */}
      <div
        style={{
          position: 'absolute',
          top: '-8px',
          right: '35px', 
          width: '16px',
          height: '16px',
          backgroundColor: 'white',
          transform: 'rotate(45deg)',
          borderTop: '1px solid #e0e0e0',
          borderLeft: '1px solid #e0e0e0',
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-brand-gray-textLighter hover:text-brand-gray-text text-2xl leading-none p-1 z-10"
        aria-label="Close notification opt-in popup"
      >
        ×
      </button>
      <div className="p-5">
        <div className="mb-4">
          <h3 id="notification-popup-title" className="text-lg font-semibold text-popup-header-text">Notifications</h3>
        </div>
        <h4 className="text-base font-medium text-popup-header-text mb-2 leading-snug">
        Stay connected with the latest from hosting.com!
        </h4>
        <p className="text-sm text-brand-gray-textMedium leading-relaxed mb-5">
        I want to receive email, text and in-app notifications from hosting.com including account updates, renewals and promotions.
        </p>
        <div className="flex flex-col gap-3 mt-5 mb-4">
          <button
            onClick={onSignUp}
            className="w-full px-4 py-3 rounded-md text-sm font-medium bg-popup-header-text text-white hover:bg-gray-700 transition-colors border border-transparent"
          >
            Sign me up
          </button>
          <button
            onClick={onAskLater}
            className="w-full px-4 py-2 rounded-md text-sm font-medium bg-white text-brand-gray-textMedium hover:bg-brand-gray-light hover:text-popup-header-text transition-colors border border-white"
          >
            Ask me later
          </button>
        </div>
        <p className="text-xs text-brand-gray-textPlaceholder mt-4 mb-0 leading-normal">
          By clicking &quot;Sign me up&quot; you consent to receive promotional emails and text messages from or on behalf hosting.com that may be sent via automated telephone dialling system. Providing consent is not a condition of purchase. You can manage your preferences at any time.
        </p>
      </div>
    </div>
  );
};

export default NotificationOptInPopup;
