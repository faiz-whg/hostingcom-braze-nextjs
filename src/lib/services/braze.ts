// hostingcom-braze-nextjs/src/lib/services/braze.ts
/**
 * @file Braze Service
 * @description This service handles interactions with the Braze Web SDK, including initialization,
 * user identification, event logging, and subscription group management.
 * It is intended to be used as a singleton throughout the application.
 * Ensures that SDK calls are only made on the client-side.
 */
'use client';

import * as braze from '@braze/web-sdk';

/**
 * @interface BrazeUserWithSubscriptionMethods
 * @description Extends the default Braze User interface to include methods for managing subscription groups.
 * This is necessary because these methods are present on the user object but not explicitly typed in the SDK.
 */
interface BrazeUserWithSubscriptionMethods extends braze.User {
  addToSubscriptionGroup: (groupId: string) => boolean;
  removeFromSubscriptionGroup: (groupId: string) => boolean;
}

/**
 * @class BrazeService
 * @description Provides methods to interact with the Braze Web SDK.
 * Manages SDK initialization, user sessions, attribute updates, event tracking, and subscription groups.
 */
class BrazeService {
  private apiKey: string | undefined; // Stores the Braze API Key from environment variables.
  private sdkEndpoint: string | undefined; // Stores the Braze SDK Endpoint from environment variables.
  public isInitialized: boolean = false; // Flag indicating if the Braze SDK has been successfully initialized.
  
  // User properties cached by this service for convenience. These are set after a successful changeUser call.
  public externalId?: string;
  public firstName?: string;
  public lastName?: string;
  public email?: string;
  public phoneNumber?: string;

  /**
   * @constructor
   * @description Initializes the BrazeService by retrieving API key and SDK endpoint from environment variables.
   * Logs a warning if these are not found.
   */
  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_BRAZE_API_KEY;
    this.sdkEndpoint = process.env.NEXT_PUBLIC_BRAZE_SDK_ENDPOINT;

    if (!this.apiKey || !this.sdkEndpoint) {
      console.warn("Braze API Key or SDK Endpoint is not configured.");
    }
  }

  /**
   * @async
   * @method initialize
   * @description Initializes the Braze Web SDK.
   * This method should be called once when the application loads on the client-side.
   * It sets up the SDK with the API key, endpoint, and other configurations.
   * Retries or guards against multiple initializations.
   * @returns {Promise<void>}
   */
  async initialize(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    if (this.isInitialized) {
      return;
    }
    if (!this.apiKey || !this.sdkEndpoint) {
      console.error("BrazeService: Cannot initialize Braze SDK. API Key or SDK Endpoint is missing. Check NEXT_PUBLIC_BRAZE_API_KEY and NEXT_PUBLIC_BRAZE_SDK_ENDPOINT environment variables.");
      return;
    }

    try {
      console.log(`BrazeService: Initializing Braze SDK with API Key: ${this.apiKey.substring(0, 5)}... and Endpoint: ${this.sdkEndpoint}`);
      // Initialize the Braze SDK.
      braze.initialize(this.apiKey, {
        baseUrl: this.sdkEndpoint, // Sets the API endpoint for the SDK.
        enableLogging: true, // Enables Braze SDK logging in the console, useful for debugging.
        noCookies: false, // Allows Braze to use cookies for session tracking and user identification.
        manageServiceWorkerExternally: false, // Set to false if Braze should manage its own service worker for push notifications.
        allowUserSuppliedJavascript: true, // Set to true to allow HTML In-App Messages to execute JavaScript. Set to false if this is a security concern or causes issues (e.g., potential CSP conflicts or SDK errors).
        // Note: Memory d5bbfc84-5a36-4cf5-9a80-b3a5fbe40dd4 mentioned an attempt to set this to `false` to resolve a ChunkLoadError.
        // Current setting is `true`, assuming HTML IAMs with JS are required.
      });
      braze.openSession();
      this.isInitialized = true;
      console.log("BrazeService: Braze SDK initialized successfully.");
    } catch (error) {
      console.error("BrazeService: Error initializing Braze SDK:", error);
      this.isInitialized = false;
    }
  }

  /**
   * @method logOutUser
   * @description Logs out the current Braze user by wiping their data from the local device.
   * This is typically called when a user logs out of the application.
   * @returns {void}
   */
  logOutUser(): void {
    if (!this.isInitialized || typeof window === 'undefined') return;
    try {
      braze.wipeData();
      console.log("BrazeService: User logged out.");
    } catch (error) {
      console.error("BrazeService: Error logging out user from Braze:", error);
    }
  }

  /**
   * @method changeUser
   * @description Changes the active Braze user and optionally updates their attributes and subscription group memberships.
   * This is a key method for identifying users to Braze and associating data with their profiles.
   * If subscriptionUpdates are provided, it attempts to update these as well. The method aims to be atomic:
   * if attribute setting is successful but any subscription update fails, it may return false.
   * (See Memory: 0208841f-714c-4cdf-9017-ced414eeee12)
   * @param {string} userId - The external ID for the user.
   * @param {object} [attributes] - Optional. An object containing user attributes to set (e.g., firstName, email, custom attributes).
   * @param {Record<string, "subscribed" | "unsubscribed">} [subscriptionUpdates] - Optional. An object where keys are subscription group IDs
   * and values are 'subscribed' or 'unsubscribed'.
   * @returns {boolean} True if the user was changed and all requested attributes/subscriptions were successfully updated, false otherwise.
   */
  changeUser(
    userId: string, 
    attributes?: { firstName?: string; lastName?: string; email?: string; phoneNumber?: string; [key: string]: unknown },
    subscriptionUpdates?: Record<string, "subscribed" | "unsubscribed">
  ): boolean {
    if (!this.isInitialized || typeof window === 'undefined') {
      console.warn("BrazeService: SDK not initialized. Cannot change user.");
      return false;
    }
    if (!userId) {
      console.error("BrazeService: userId is required to change user.");
      return false;
    }

    console.log(`BrazeService: Attempting to change user to ${userId}`, attributes || '');

    try {
      braze.changeUser(userId);
      console.log(`BrazeService: braze.changeUser('${userId}') called.`);

      // After changing the user, retrieve the user object to set attributes and manage subscriptions.
      // Braze SDK applies subsequent operations to the newly identified user context.
      const user = braze.getUser();
      if (user) {
        this.externalId = userId; // Update service's cached ID
        if (attributes?.firstName) {
          user.setFirstName(attributes.firstName);
          this.firstName = attributes.firstName;
        }
        if (attributes?.lastName) {
          user.setLastName(attributes.lastName);
          this.lastName = attributes.lastName;
        }
        if (attributes?.email) {
          user.setEmail(attributes.email);
          this.email = attributes.email;
        }
        if (attributes?.phoneNumber) {
          user.setPhoneNumber(attributes.phoneNumber);
          this.phoneNumber = attributes.phoneNumber;
        }

        if (attributes) {
          Object.keys(attributes).forEach(key => {
            const RESERVED_KEYS = ['firstName', 'lastName', 'email', 'phoneNumber'];
            if (!RESERVED_KEYS.includes(key) && attributes[key] !== undefined && attributes[key] !== null) {
              user.setCustomUserAttribute(key, attributes[key] as string | number | boolean | Date | null | Array<string | number | boolean | Date>);
              console.log(`BrazeService: Set custom attribute ${key}=${attributes[key]} for user ${userId}`);
            }
          });
        }
        console.log(`BrazeService: Attributes set for user ${userId}.`);
        
        // Process subscription group updates if they are provided.
        if (subscriptionUpdates) {
          const userWithSubs = user as BrazeUserWithSubscriptionMethods;
          let allSubscriptionUpdatesSucceeded = true;
          Object.entries(subscriptionUpdates).forEach(([groupId, state]) => {
            try {
              if (state === "subscribed") {
                const result = userWithSubs.addToSubscriptionGroup(groupId);
                console.log(`Braze SDK (via changeUser): Added user to subscription group ${groupId}. Result: ${result}`);
                if (!result) allSubscriptionUpdatesSucceeded = false;
              } else if (state === "unsubscribed") {
                const result = userWithSubs.removeFromSubscriptionGroup(groupId);
                console.log(`Braze SDK (via changeUser): Removed user from subscription group ${groupId}. Result: ${result}`);
                if (!result) allSubscriptionUpdatesSucceeded = false;
              } else {
                console.warn(`BrazeService: Unknown subscription state '${state}' for group ${groupId} during changeUser.`);
              }
            } catch (subError) {
              console.error(`BrazeService: Error updating subscription group ${groupId} for user ${userId} during changeUser:`, subError);
              allSubscriptionUpdatesSucceeded = false;
            }
          });
          if (!allSubscriptionUpdatesSucceeded) {
            console.error(`BrazeService: One or more subscription group updates failed for user ${userId} during changeUser.`);
            // Decide if this constitutes an overall failure of changeUser
            // For now, if attributes were set but subs failed, we might still return true for attribute part, or false for overall.
            // Strict handling: if any subscription update fails, the overall 'changeUser' operation for subscriptions is considered unsuccessful.
            // This ensures that the caller is aware if not all parts of the request were completed.
            return false; 
          }
          console.log(`BrazeService: Subscription groups updated for user ${userId} as part of changeUser.`);
        }
        // If all operations (attribute setting and, if provided, all subscription updates) succeeded.
        return true;
      } else {
        console.warn(`BrazeService: braze.getUser() returned null after changeUser('${userId}'). Attributes and subscriptions cannot be set.`);
        return false;
      }
    } catch (error) {
      console.error(`BrazeService: Error during changeUser or attribute setting for ${userId}:`, error);
      return false;
    }
  }

  /**
   * @method logCustomEvent
   * @description Logs a custom event to Braze for the current user.
   * Custom events are used for tracking user actions and triggering campaigns.
   * @param {string} eventName - The name of the custom event.
   * @param {object} [eventProperties] - Optional. An object containing properties associated with the event.
   * @returns {void}
   */
  logCustomEvent(eventName: string, eventProperties?: Record<string, string | number | boolean | Date | null | Array<string | number | boolean | Date>>): void {
    if (!this.isInitialized || typeof window === 'undefined') {
      console.warn(`BrazeService: SDK not initialized. Cannot log event '${eventName}'.`);
      return;
    }
    try {
      braze.logCustomEvent(eventName, eventProperties);
      console.log(`BrazeService: Logged custom event '${eventName}'`, eventProperties || '');
    } catch (error) {
      console.error(`BrazeService: Error logging custom event '${eventName}':`, error);
    }
  }

  /**
   * @method updateUserSubscriptionGroupsViaSDK
   * @description Updates the current user's subscription group memberships directly via SDK methods.
   * This method is an alternative to updating subscriptions via `changeUser` if only subscription changes are needed.
   * @param {Record<string, "subscribed" | "unsubscribed">} subscriptionUpdates - An object where keys are subscription group IDs
   * and values are 'subscribed' or 'unsubscribed'.
   * @returns {boolean} True if the user object was available and attempts were made to update subscriptions, false if the user object was not found or SDK is not initialized.
   * Note: Individual subscription update successes/failures are logged but not aggregated into a single boolean return from Braze SDK calls here.
   */
  updateUserSubscriptionGroupsViaSDK(
    subscriptionUpdates: Record<string, "subscribed" | "unsubscribed">
  ): boolean {
    if (!this.isInitialized || typeof window === 'undefined') {
      console.warn("BrazeService: SDK not initialized. Cannot update subscription groups.");
      return false;
    }
    try {
      const user = braze.getUser();
      if (!user) {
        console.error("BrazeService: User not available. Cannot update subscription groups.");
        return false;
      }

      Object.entries(subscriptionUpdates).forEach(([groupId, state]) => {
        const brazeUserWithSubs = user as BrazeUserWithSubscriptionMethods;
        if (state === "subscribed") {
          brazeUserWithSubs.addToSubscriptionGroup(groupId);
          console.log(`Braze SDK: Added user to subscription group ${groupId}`);
        } else if (state === "unsubscribed") {
          brazeUserWithSubs.removeFromSubscriptionGroup(groupId);
          console.log(`Braze SDK: Removed user from subscription group ${groupId}`);
        } else {
          console.warn(`BrazeService: Unknown subscription state '${state}' for group ${groupId}.`);
        }
      });
      
      return true;
    } catch (error) {
      console.error("BrazeService: Error updating subscription groups via SDK:", error);
      return false;
    }
  }

  /**
   * @method subscribeToContentCardsUpdates
   * @description Subscribes to updates for Braze Content Cards.
   * The provided callback will be invoked when new Content Cards data is available.
   * @param {(contentCardsObject: braze.ContentCards) => void} callback - The function to call with the ContentCards object.
   * @returns {string | undefined} A subscription ID string if successful, or undefined if the SDK is not initialized or an error occurs.
   * This ID should be used with `unsubscribeFromContentCardsUpdates` to stop listening.
   */
  subscribeToContentCardsUpdates(callback: (contentCardsObject: braze.ContentCards) => void): string | undefined {
    if (!this.isInitialized || typeof window === 'undefined') {
      console.warn("BrazeService: SDK not initialized. Cannot subscribe to content cards updates.");
      return undefined;
    }
    try {
      const loggingCallback = (contentCardsObject: braze.ContentCards) => {
        try {
            console.log("BrazeService: Received raw content cards update:", JSON.parse(JSON.stringify(contentCardsObject)));
        } catch (e) {
            console.warn("BrazeService: Could not stringify/parse raw content cards for logging. Logging object directly:", contentCardsObject, e);
        }
        callback(contentCardsObject); // Call the original callback
      };
      const subscriptionId = braze.subscribeToContentCardsUpdates(loggingCallback);
      console.log("BrazeService: Subscribed to content cards updates (with raw card logging).");
      return subscriptionId;
    } catch (error) {
      console.error("BrazeService: Error subscribing to content cards updates:", error);
      return undefined;
    }
  }

  /**
   * @method unsubscribeFromContentCardsUpdates
   * @description Unsubscribes from Content Cards updates using a subscription ID.
   * @param {string} subscriptionId - The ID returned by `subscribeToContentCardsUpdates`.
   * @returns {void}
   */
  unsubscribeFromContentCardsUpdates(subscriptionId: string): void {
    if (!this.isInitialized || typeof window === 'undefined') {
      console.warn("BrazeService: SDK not initialized. Cannot unsubscribe from content cards updates.");
      return;
    }
    if (typeof subscriptionId !== 'string') {
      console.warn("BrazeService: Invalid subscriptionId provided for unsubscribing.");
      return;
    }
    try {
      braze.removeSubscription(subscriptionId);
      console.log(`BrazeService: Unsubscribed from content cards updates with ID: ${subscriptionId}.`);
    } catch (error) {
      console.error(`BrazeService: Error unsubscribing from content cards updates with ID ${subscriptionId}:`, error);
    }
  }

  /**
   * @method requestContentCardsRefresh
   * @description Manually requests a refresh of Content Cards from the Braze servers.
   * Useful if you want to ensure the user has the latest cards without waiting for automatic refresh cycles.
   * @returns {void}
   */
  requestContentCardsRefresh(): void {
    if (!this.isInitialized || typeof window === 'undefined') {
      console.warn("BrazeService: SDK not initialized. Cannot refresh content cards.");
      return;
    }
    try {
      braze.requestContentCardsRefresh();
      console.log("BrazeService: Content cards refresh requested.");
    } catch (error) {
      console.error("BrazeService: Error requesting content cards refresh:", error);
    }
  }

  /**
   * @method getCachedContentCards
   * @description Retrieves the most recently cached Content Cards object.
   * This does not make a network request; it returns what's already stored locally.
   * @returns {braze.ContentCards | undefined} The cached ContentCards object, or undefined if none are cached or SDK not initialized.
   */
  getCachedContentCards(): braze.ContentCards | undefined {
    if (!this.isInitialized || typeof window === 'undefined') {
      console.warn("BrazeService: SDK not initialized. Cannot get cached content cards.");
      return undefined;
    }
    try {
      const contentCardsObject = braze.getCachedContentCards();
      if (contentCardsObject && contentCardsObject.cards) {
        console.log(`BrazeService: Retrieved ${contentCardsObject.cards.length} cached content cards.`);
        try {
            console.log("BrazeService: Raw cached content cards:", JSON.parse(JSON.stringify(contentCardsObject)));
        } catch (e) {
            console.warn("BrazeService: Could not stringify/parse cached content cards for logging. Logging object directly:", contentCardsObject, e);
        }
      } else {
        console.log("BrazeService: No cached content cards available or cards array is missing.");
      }
      return contentCardsObject;
    } catch (error) {
      console.error("BrazeService: Error getting cached content cards:", error);
      return undefined;
    }
  }

  /**
   * @method logContentCardImpression
   * @description Logs an impression event for a Content Card.
   * This typically means the card became visible to the user.
   * Internally, this method calls `braze.logContentCardImpressions` with an array containing the single card.
   * @param {braze.Card} card - The Content Card for which to log an impression.
   * @returns {void}
   */
  logContentCardImpression(card: braze.Card): void {
    if (!this.isInitialized || typeof window === 'undefined') {
      console.warn("BrazeService: SDK not initialized. Cannot log content card impression.");
      return;
    }
    if (!card || !card.id) {
      console.warn("BrazeService: Invalid card provided for logging impression.");
      return;
    }
    try {
      braze.logContentCardImpressions([card]);
      console.log(`BrazeService: Logged impression for content card ${card.id}.`);
    } catch (error) {
      console.error(`BrazeService: Error logging content card impression for card ${card.id}:`, error);
    }
  }

  /**
   * @method logContentCardClick
   * @description Logs a click event for a specific Content Card.
   * This indicates that the user interacted with (clicked on) the card.
   * @param {braze.Card} card - The Content Card that was clicked.
   * @returns {void}
   */
  logContentCardClick(card: braze.Card): void {
    if (!this.isInitialized || typeof window === 'undefined') {
      console.warn("BrazeService: SDK not initialized. Cannot log content card click.");
      return;
    }
    if (!card || !card.id) {
      console.warn("BrazeService: Invalid card provided for logging click.");
      return;
    }
    try {
      braze.logContentCardClick(card);
      console.log(`BrazeService: Logged click for content card ${card.id}.`);
    } catch (error) {
      console.error(`BrazeService: Error logging content card click for card ${card.id}:`, error);
    }
  }
}

/**
 * Singleton instance of the BrazeService.
 * This instance is exported to ensure a single point of interaction with the Braze SDK throughout the application.
 */
const brazeService = new BrazeService();
export default brazeService;
