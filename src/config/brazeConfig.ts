/**
 * @file brazeConfig.ts
 * @description Configuration for Braze integration, specifically for mapping Upmind notification preferences to Braze Subscription Groups.
 * This file contains the necessary IDs and mappings to synchronize user preferences between the two systems.
 */

/**
 * @interface BrazeSubscriptionGroups
 * @description Defines the structure for storing Braze Subscription Group IDs.
 * These IDs are used to manage user subscriptions in Braze.
 */
interface BrazeSubscriptionGroups {
  MARKETING_EMAIL: string;
  MARKETING_IN_APP: string;
  SERVICE_UPDATES_EMAIL: string;
  SERVICE_UPDATES_IN_APP: string;
}

/**
 * @constant BRAZE_SUBSCRIPTION_GROUPS
 * @description Hardcoded Braze Subscription Group IDs.
 * Replace these with actual IDs from your Braze dashboard.
 * - `MARKETING_EMAIL`: Subscription group for marketing emails.
 * - `MARKETING_IN_APP`: Subscription group for marketing in-app messages.
 * - `SERVICE_UPDATES_EMAIL`: Subscription group for service update emails.
 * - `SERVICE_UPDATES_IN_APP`: Subscription group for service update in-app messages.
 */
export const BRAZE_SUBSCRIPTION_GROUPS: BrazeSubscriptionGroups = {
  MARKETING_EMAIL: 'd220614c-43a5-45de-8672-e69ae5e622f5',
  MARKETING_IN_APP: 'a33e57e6-b321-4c95-97ac-e56aa59277c8',
  SERVICE_UPDATES_EMAIL: '7e206bbe-0ef4-4430-897d-4bb324006a0e',
  SERVICE_UPDATES_IN_APP: '13dab92d-d33a-4a84-ba20-403f357a4bf2',
};

/**
 * @interface UpmindTopicIds
 * @description Defines the structure for storing Upmind Notification Topic IDs.
 * These are identifiers for different categories of notifications within Upmind.
 */
interface UpmindTopicIds {
  MARKETING: string;
  SERVICE_UPDATES: string;
  // Add other topic IDs here
}

/**
 * @constant UPMIND_TOPIC_IDS
 * @description Hardcoded Upmind Notification Topic IDs.
 * These should match the Topic IDs configured in your Upmind system.
 * - `MARKETING`: Topic ID for marketing-related notifications.
 * - `SERVICE_UPDATES`: Topic ID for service update notifications.
 */
const UPMIND_TOPIC_IDS: UpmindTopicIds = {
    MARKETING: "d15196e0-2e51-36d4-29b0-429807875d30",
    SERVICE_UPDATES: "31261e50-9897-3d24-79ce-45e610832d75",
};

/**
 * @interface UpmindChannelIds
 * @description Defines the structure for storing Upmind Notification Channel IDs.
 * These identify the delivery method for notifications (e.g., Email, In-App).
 */
interface UpmindChannelIds {
  EMAIL: string;
  IN_APP: string;
  // Add other channel IDs here
}

/**
 * @constant UPMIND_CHANNEL_IDS
 * @description Hardcoded Upmind Notification Channel IDs.
 * These should match the Channel IDs configured in your Upmind system.
 * - `EMAIL`: Channel ID for email notifications.
 * - `IN_APP`: Channel ID for in-app notifications.
 */
const UPMIND_CHANNEL_IDS: UpmindChannelIds = {
    EMAIL: "3d6d5308-7682-51d4-87c1-47e390921e61",
    IN_APP: "d15196e0-2e51-36d4-29b0-429807875d30",
};

/**
 * @interface UpmindToBrazeMap
 * @description Defines the structure for the mapping between Upmind topic/channel combinations and Braze Subscription Group IDs.
 * The outer key is the Upmind Topic ID, and the inner key is the Upmind Channel ID.
 * The value is the corresponding Braze Subscription Group ID, or `undefined` if no direct mapping exists.
 */
interface UpmindToBrazeMap {
  [upmindTopicId: string]: {
    [upmindChannelId: string]: string | undefined; // Braze Group ID or undefined if no mapping
  };
}

/**
 * @constant UPMIND_TO_BRAZE_MAP
 * @description Defines the explicit mapping from Upmind notification preferences (topic and channel) to Braze Subscription Groups.
 * This structure is used to determine which Braze group a user should be subscribed to or unsubscribed from
 * based on their Upmind settings.
 */
export const UPMIND_TO_BRAZE_MAP: UpmindToBrazeMap = {
  [UPMIND_TOPIC_IDS.MARKETING]: {
    [UPMIND_CHANNEL_IDS.EMAIL]: BRAZE_SUBSCRIPTION_GROUPS.MARKETING_EMAIL,
    [UPMIND_CHANNEL_IDS.IN_APP]: BRAZE_SUBSCRIPTION_GROUPS.MARKETING_IN_APP,
  },
  [UPMIND_TOPIC_IDS.SERVICE_UPDATES]: {
    [UPMIND_CHANNEL_IDS.EMAIL]: BRAZE_SUBSCRIPTION_GROUPS.SERVICE_UPDATES_EMAIL,
    [UPMIND_CHANNEL_IDS.IN_APP]: BRAZE_SUBSCRIPTION_GROUPS.SERVICE_UPDATES_IN_APP,
  },
};

/**
 * @constant RELEVANT_UPMIND_TOPICS_FOR_BRAZE_SYNC
 * @description An array of Upmind Topic IDs that are relevant for synchronization with Braze.
 * Only preferences related to these topics will trigger updates to Braze subscription groups.
 */
export const RELEVANT_UPMIND_TOPICS_FOR_BRAZE_SYNC: string[] = [
    UPMIND_TOPIC_IDS.MARKETING,
    UPMIND_TOPIC_IDS.SERVICE_UPDATES,
];

/**
 * @function getBrazeSubscriptionGroupId
 * @description Helper function to retrieve the Braze Subscription Group ID for a given Upmind topic and channel ID.
 * @param {string} upmindTopicId - The Upmind Topic ID.
 * @param {string} upmindChannelId - The Upmind Channel ID.
 * @returns {string | null} The corresponding Braze Subscription Group ID if a mapping exists, otherwise `null`.
 */
export const getBrazeSubscriptionGroupId = (upmindTopicId: string, upmindChannelId: string): string | null => {
  return UPMIND_TO_BRAZE_MAP[upmindTopicId]?.[upmindChannelId] || null;
};
