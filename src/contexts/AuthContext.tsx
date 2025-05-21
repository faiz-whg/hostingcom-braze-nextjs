/**
 * @file AuthContext.tsx
 * @description Provides authentication context to the application.
 * Manages user authentication state (isAuthenticated, isLoadingAuth), handles login/logout procedures,
 * and integrates with Braze for user session tracking.
 */
'use client'; // Mark as a Client Component

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Next.js navigation
// Assuming brazeService will be available at this path. We created a placeholder earlier.
import brazeService from '@/lib/services/braze'; // Service for interacting with the Braze SDK.

/**
 * @interface AuthContextType
 * @description Defines the shape of the authentication context provided to consumers.
 */
interface AuthContextType {
  /** True if the user is currently authenticated, false otherwise. */
  isAuthenticated: boolean;
  /** True if the authentication status is currently being determined (e.g., on initial load), false otherwise. */
  isLoadingAuth: boolean;
  /**
   * @method login
   * @description Function to log the user in.
   * Stores tokens, sets authentication state, and identifies the user with Braze.
   * @param {string} accessToken - The access token received upon successful authentication.
   * @param {string} [refreshToken] - Optional refresh token.
   */
  login: (accessToken: string, refreshToken?: string) => void;
  /**
   * @method logout
   * @description Function to log the user out.
   * Clears tokens, resets authentication state, and ends the Braze user session.
   */
  logout: () => void;
}

/**
 * @constant AuthContext
 * @description React context for managing authentication state and actions.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * @component AuthProvider
 * @description Provider component that makes the authentication context available to its children.
 * It manages authentication state, token storage, and side effects like Braze initialization.
 * @param {object} props - The component props.
 * @param {ReactNode} props.children - The child components that will have access to the AuthContext.
 * @returns {React.ReactElement} The AuthProvider component.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // State to track if the user is authenticated.
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // State to track if the authentication status is currently loading (e.g., on initial app load).
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname(); // To potentially redirect based on current path after auth state changes

  // Effect to check for existing authentication token on initial load and initialize Braze.
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
    setIsLoadingAuth(false);

    // Helper function to initialize the Braze SDK.
    const initBraze = async () => {
      // Check if already initialized by another part of the app or if on server
      if (typeof window !== 'undefined' && !brazeService.isInitialized) {
        try {
          // Ensure API key and endpoint are set before initializing
          // This might involve fetching them if they are not directly in process.env.NEXT_PUBLIC_
          // For now, assuming brazeService handles its config internally
          await brazeService.initialize(); 
          console.log("AuthContext: Braze initialized");
        } catch (error) {
          console.error("AuthContext: Braze initialization error", error);
        }
      }
    };
    if (!!token) { // Only init Braze if authenticated, or adjust as needed
        initBraze();
    }
  }, []);

  /**
   * @function login
   * @description Handles the user login process.
   * Stores authentication tokens in localStorage, updates authentication state,
   * initializes Braze if not already done, changes the Braze user, logs a 'User Logged In' event,
   * and redirects the user.
   * @param {string} accessToken - The user's access token.
   * @param {string} [refreshToken] - The user's refresh token (optional).
   */
  const login = (accessToken: string, refreshToken?: string) => {
    setIsLoadingAuth(true); // Indicate loading state during login
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    setIsAuthenticated(true);

    // Braze user identification and event logging
    const userEmail = localStorage.getItem('userEmail'); // Assuming email is stored and is the Braze external_id
    if (userEmail && typeof window !== 'undefined') {
      if (!brazeService.isInitialized) {
        brazeService.initialize()
          .then(() => {
            console.log("AuthContext: Braze initialized on login");
            brazeService.changeUser(userEmail);
            brazeService.logCustomEvent("User Logged In", { loginMethod: "credentials" });
          })
          .catch(err => console.error("AuthContext: Braze init error on login", err));
      } else {
        brazeService.changeUser(userEmail);
        brazeService.logCustomEvent("User Logged In", { loginMethod: "credentials" });
      }
    } else if (typeof window !== 'undefined' && !brazeService.isInitialized) {
      // Initialize Braze even if userEmail is not available yet, if needed by app logic elsewhere
      brazeService.initialize()
        .then(() => console.log("AuthContext: Braze initialized on login (no user email)"))
        .catch(err => console.error("AuthContext: Braze init error on login (no user email)", err));
    }

    setIsLoadingAuth(false); // Login process complete, no longer loading auth state

    // Redirect to a default page or the intended page
    // Avoid redirecting to auth pages if already authenticated
    const targetPath = (pathname === '/' || pathname === '/auth/login' || pathname === '/auth/register') 
                       ? '/dashboard' 
                       : pathname || '/dashboard'; // Fallback to dashboard if pathname is null
    router.push(targetPath);
  };

  /**
   * @function logout
   * @description Handles the user logout process.
   * Ends the Braze user session (if SDK is initialized), removes tokens from localStorage,
   * updates authentication state, and redirects the user to the home page.
   */
  const logout = () => {
    if (brazeService.isInitialized && typeof window !== 'undefined') {
      brazeService.logOutUser();
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    router.push('/'); // Redirect to home/login page
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoadingAuth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * @hook useAuth
 * @description Custom hook to easily consume the AuthContext.
 * Provides access to authentication state (isAuthenticated, isLoadingAuth) and methods (login, logout).
 * @throws {Error} If used outside of an AuthProvider.
 * @returns {AuthContextType} The authentication context.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
