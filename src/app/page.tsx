'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
// We will create and import AuthPageContent or similar later
// import AuthPageContent from '@/components/AuthPageContent'; 
import AuthForm from '@/components/auth/AuthForm'; // Import the new AuthForm

/**
 * @page HomePage
 * @description The main entry page for the application (`/`).
 * This component handles initial routing based on the user's authentication status.
 * It uses the `useAuth` hook to check if the user is authenticated and if authentication is still loading.
 * - If authentication is loading, it displays a `SimpleAuthSpinner`.
 * - If the user is authenticated, it redirects them to the `/dashboard` page.
 * - If the user is not authenticated, it displays the `AuthForm` component for login or registration.
 * @returns {JSX.Element} The UI for the home page, which is either a loading spinner, the `AuthForm`, or a fallback loading message during transition.
 */
export default function HomePage() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const router = useRouter();

  /**
   * @effect
   * @description Effect hook to handle redirection based on authentication state.
   * If authentication is not loading and the user is authenticated, it redirects
   * the user to the `/dashboard` page using `router.replace()`.
   * This effect runs when `isAuthenticated`, `isLoadingAuth`, or `router` changes.
   */
  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoadingAuth, router]);

/**
   * @component SimpleAuthSpinner
   * @description A simple inline functional component that renders a loading spinner.
   * Used to indicate that the authentication status is currently being checked.
   * @returns {JSX.Element} A div containing an animated spinner.
   */
  const SimpleAuthSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-solid border-brand-blue border-t-transparent"></div>
    </div>
  );

  if (isLoadingAuth) {
    return <SimpleAuthSpinner />;
  }

  if (!isAuthenticated) {
    // Placeholder for your AuthPage content has been replaced by AuthForm
    return <AuthForm />;
  }

  // This part should ideally not be reached if redirection works,
  // but it's a fallback during loading/transition.
  return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
}

