/**
 * @file browserUtils.ts
 * @description Utility functions for safely interacting with browser-specific APIs and objects.
 * This helps in preventing errors when code might be executed in non-browser environments (e.g., server-side rendering).
 */

/**
 * @constant isBrowser
 * @description A boolean flag indicating whether the code is currently running in a browser environment.
 * True if `window` object is defined, false otherwise.
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * @interface SafeNavigator
 * @description Defines a minimal structure for the `navigator` object to ensure type safety when accessing its properties.
 * This is particularly useful as `window.navigator` might be an empty object or undefined in non-browser contexts.
 * Properties included are common ones like `userAgent`, `language`, and `onLine`.
 */
interface SafeNavigator {
  userAgent?: string;
  language?: string;
  onLine?: boolean;
  // Add other navigator properties you might use here
}

/**
 * @function getNavigator
 * @description Safely retrieves the `window.navigator` object.
 * @returns {SafeNavigator} The `window.navigator` object if in a browser environment, otherwise an empty object adhering to the `SafeNavigator` interface.
 */
export const getNavigator = (): SafeNavigator => {
  return isBrowser ? window.navigator : {};
};

/**
 * @function getUserAgent
 * @description Safely retrieves the user agent string from the navigator.
 * @returns {string} The user agent string, or an empty string if not available.
 */
export const getUserAgent = (): string => {
  return getNavigator().userAgent || '';
};

/**
 * @function getLanguage
 * @description Safely retrieves the browser's preferred language from the navigator.
 * @returns {string} The browser's language string (e.g., "en-US"), or defaults to "en" if not available or empty.
 */
export const getLanguage = (): string => {
  // Default to 'en' if navigator.language is not available or is an empty string
  return getNavigator().language || 'en';
};

/**
 * @function isOnline
 * @description Safely checks if the browser is currently online using `navigator.onLine`.
 * @returns {boolean} True if the browser reports an online status, false if offline or if the property is not available.
 */
export const isOnline = (): boolean => {
  return getNavigator().onLine || false; // Default to false if not available
};
