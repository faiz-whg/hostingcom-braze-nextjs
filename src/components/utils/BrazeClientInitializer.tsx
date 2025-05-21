'use client';

import { useEffect } from 'react';
import BrazeService from '@/lib/services/braze';

interface BrazeClientInitializerProps {
  onInitialized?: () => void;
}

/**
 * @component BrazeClientInitializer
 * @description A client-side React component responsible for initializing the Braze SDK.
 * It uses a `useEffect` hook to ensure Braze is initialized once when the component mounts.
 * This component does not render any UI (returns `null`). Its sole purpose is to trigger side effects.
 * @param {BrazeClientInitializerProps} props - The component's props.
 * @param {() => void} [props.onInitialized] - Optional callback function to be called after successful initialization.
 */
const BrazeClientInitializer = ({ onInitialized }: BrazeClientInitializerProps): null => {
  /**
   * @effect
   * @description Effect hook that runs once on component mount to initialize the Braze SDK.
   * It calls the `initBraze` asynchronous function to perform the initialization logic.
   */
  useEffect(() => {
    console.log('BrazeClientInitializer: useEffect hook started.'); // New log
    /**
     * @async
     * @function initBraze
     * @description Asynchronously initializes the Braze SDK if it hasn't been initialized already.
     * It checks `BrazeService.isInitialized` and, if false, calls `BrazeService.initialize()`.
     * Logs success or error messages to the console. If an `onInitialized` callback is provided,
     * it's called upon successful initialization or if the SDK was already initialized.
     */
    const initBraze = async () => {
      if (!BrazeService.isInitialized) {
        try {
          await BrazeService.initialize();
          console.log('BrazeClientInitializer: Braze SDK initialized via client component.');
          if (onInitialized) {
            console.log('BrazeClientInitializer: Attempting to call onInitialized() after new initialization.');
            onInitialized();
          }
        } catch (error) {
          console.error('BrazeClientInitializer: Braze SDK initialization error:', error);
        }
      } else if (onInitialized) { // If Braze SDK was already initialized
        console.log('BrazeClientInitializer: Braze SDK was already initialized. Attempting to call onInitialized().');
        onInitialized();
      } else {
        // This case handles when Braze is already initialized but no onInitialized callback is provided.
        // Or, if onInitialized is undefined from the start.
        console.log('BrazeClientInitializer: Braze SDK already initialized, but no onInitialized callback was provided or it is undefined.');
      }
    };

    initBraze();
  }, [onInitialized]); // Added onInitialized to dependency array

  return null; // This component does not render any UI
};

export default BrazeClientInitializer;
