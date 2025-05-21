/**
 * @file notificationData.ts
 * @description Defines the static data for notification channels and topics available to users.
 * This data is used to render options in the notification preferences page and to map to Upmind/Braze configurations.
 */

/**
 * @typedef Channel
 * @property {string} id - The unique identifier for the notification channel (e.g., Upmind Channel ID).
 * @property {string} name - The display name for the channel (e.g., "Email", "In-App").
 */

/**
 * @constant CHANNELS_DATA
 * @type {Channel[]}
 * @description An array of available notification channels.
 * Each object contains the ID and display name for a channel.
 * These IDs should correspond to the Channel IDs in your Upmind system.
 */
export const CHANNELS_DATA = [
    { id: "3d6d5308-7682-51d4-87c1-47e390921e61", name: "Email" },
    { id: "d15196e0-2e51-36d4-29b0-429807875d30", name: "In-App" },
];

/**
 * @typedef Topic
 * @property {string} id - The unique identifier for the notification topic (e.g., Upmind Topic ID).
 * @property {string} name - The display name for the topic (e.g., "System", "Marketing").
 * @property {string} description - A brief description of what notifications this topic covers.
 * @property {boolean} can_opt_out - Indicates if users can opt out of this notification topic. `false` means it's mandatory.
 */

/**
 * @constant TOPICS_DATA
 * @type {Topic[]}
 * @description An array of available notification topics.
 * Each object contains the ID, display name, description, and opt-out status for a topic.
 * These IDs should correspond to the Topic IDs in your Upmind system.
 */
export const TOPICS_DATA = [
    { id: "3d6d5308-7682-51d4-87c1-47e390921e61", name: "System", description: "Essential for account operation and security.", can_opt_out: false },
    { id: "26e2e071-d931-d5e4-68a6-460287583960", name: "Billing", description: "Invoices, payments, and billing-related events.", can_opt_out: true },
    { id: "d15196e0-2e51-36d4-29b0-429807875d30", name: "Marketing", description: "Seasonal offers, new products, and promotions.", can_opt_out: true },
    { id: "e57052d1-37e0-8d24-13f5-495163789e68", name: "Support", description: "Updates on support tickets and responses.", can_opt_out: true },
    { id: "31261e50-9897-3d24-79ce-45e610832d75", name: "Service Updates", description: "Changes to service, new features, maintenance.", can_opt_out: true },
];
