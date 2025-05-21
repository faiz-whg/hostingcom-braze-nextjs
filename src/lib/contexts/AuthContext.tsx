'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import BrazeService from '@/lib/services/braze'; // Ensure this path and service structure are correct
import dynamic from 'next/dynamic';

const DynamicBrazeClientInitializer = dynamic(
  () => import('@/components/utils/BrazeClientInitializer'),
  { ssr: false }
);

interface AuthContextType {
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  login: (accessToken: string, refreshToken?: string) => void;
  logout: () => void;
  showNotificationOptIn: boolean;
  setShowNotificationOptIn: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [brazeInitialized, setBrazeInitialized] = useState(false); // New state for Braze initialization status
  const [showNotificationOptIn, setShowNotificationOptIn] = useState(false); // State for notification opt-in popup
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');

      if (brazeInitialized) {
        // Braze is now initialized, we can make a final decision on auth state and loading.
        if (token) {
          setIsAuthenticated(true);
          const actorId = localStorage.getItem('actor_id');
          const userEmail = localStorage.getItem('userEmail');
          if (actorId) {
            const attributes: { email?: string } = {};
            if (userEmail) {
              attributes.email = userEmail;
            }
            console.log(`AuthContext: Braze initialized. Token found. Re-setting Braze user to ${actorId}. Attributes:`, attributes);
            BrazeService.changeUser(actorId, attributes);
          } else {
            console.warn("AuthContext: Braze initialized. Token found, but actor_id missing. Cannot set Braze user.");
          }
        } else {
          // Braze initialized, but no token.
          setIsAuthenticated(false);
          console.log("AuthContext: Braze initialized. No token found.");
        }
        setIsLoadingAuth(false); // Critical: Set loading to false once Braze is initialized.
      } else {
        // Braze is not yet initialized.
        if (token) {
          // Token exists, user is likely authenticated, but wait for Braze before finishing loading.
          setIsAuthenticated(true);
          console.log("AuthContext: Token found. Waiting for Braze initialization...");
        } else {
          // No token, and Braze not initialized. User is not authenticated.
          // We still wait for Braze to be initialized before setting isLoadingAuth to false,
          // as some apps might need Braze even for logged-out users (e.g. default content cards).
          setIsAuthenticated(false);
          console.log("AuthContext: No token. Waiting for Braze initialization...");
        }
        // isLoadingAuth remains true here, as we are waiting for brazeInitialized to become true.
      }
    }
  }, [brazeInitialized]); // Re-run this effect when Braze initialization status changes

  const login = (accessToken: string, refreshToken?: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
    }
    setIsAuthenticated(true);
    // Assuming Braze user context (e.g., via BrazeService.changeUser()) 
    // is established by the calling component or a service after Upmind login and before/during this call.
    if (BrazeService.isInitialized) {
      BrazeService.logCustomEvent('User Logged In');
      console.log('AuthContext: Logged Braze event "User Logged In"');
    }
    
    // Check if user has already opted in to notifications
    if (typeof window !== 'undefined') {
      const optInStatus = localStorage.getItem('notification_opt_in_status');
      const dismissedTimestamp = localStorage.getItem('notification_opt_in_dismissed_timestamp');
      const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
      
      console.log('AuthContext login: Checking notification opt-in status', { 
        optInStatus, 
        dismissedTimestamp, 
        shouldShow: optInStatus !== 'subscribed' && 
          (!dismissedTimestamp || (Date.now() - parseInt(dismissedTimestamp || '0')) > sevenDaysInMillis)
      });
      
      // Show notification popup if user hasn't opted in or dismissed recently
      if (optInStatus !== 'subscribed' && 
          (!dismissedTimestamp || (Date.now() - parseInt(dismissedTimestamp || '0')) > sevenDaysInMillis)) {
        console.log('AuthContext login: Will show notification popup after delay');
        // Delay showing the popup to ensure smooth transition after login and give user time to orient
        setTimeout(() => {
          console.log('AuthContext login: Setting showNotificationOptIn to true');
          setShowNotificationOptIn(true);
        }, 3500); // Increased to 3.5 seconds for better user experience
      }
    }
    
    // Navigation is typically handled by the component calling login (e.g., redirecting after successful form submission)
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      if (BrazeService.isInitialized) {
        // TODO: Ensure BrazeService.logOutUser() is implemented and works as expected.
        // This might involve clearing user-specific data from Braze SDK.
        BrazeService.logCustomEvent('User Logged Out');
        console.log('AuthContext: Attempting to log User Logged Out event.');
        // Add a small delay to allow Braze to process the event before full logout
        setTimeout(() => {
          if (BrazeService.isInitialized) { // Re-check, though unlikely to change in 100ms
            BrazeService.logOutUser();
            console.log('AuthContext: BrazeService.logOutUser() called after delay.');
          }
        }, 100); // 100ms delay, can be adjusted
      }
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('actor_id');
      // Consider clearing other app-specific localStorage items if necessary
      // localStorage.clear(); // Use with caution: clears everything for the domain
    }
    setIsAuthenticated(false);
    router.push('/'); // Redirect to the homepage (which should show login)
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoadingAuth, 
      login, 
      logout,
      showNotificationOptIn,
      setShowNotificationOptIn
    }}>
      {isLoadingAuth ? (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <p className="text-lg text-gray-700">Loading Authentication...</p>
          {/* Consider adding a spinner component here */}
        </div>
      ) : (
        children
      )}
      {/* Always render BrazeClientInitializer so it can set brazeInitialized */}
      <DynamicBrazeClientInitializer onInitialized={() => {
        console.log('AuthContext: onInitialized callback from BrazeClientInitializer invoked. Setting brazeInitialized to true.');
        setBrazeInitialized(true);
      }} />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
