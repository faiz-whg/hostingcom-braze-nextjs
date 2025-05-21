/**
 * @file page.tsx (Notification Preferences)
 * @description Client component for managing user notification preferences.
 * It allows users to view and update their opt-in/opt-out settings for various notification topics (e.g., Marketing, Service Updates)
 * and channels (e.g., Email, In-App). These preferences are fetched from and saved to the Upmind API.
 * Crucially, changes to preferences relevant to Braze (as defined in `RELEVANT_UPMIND_TOPICS_FOR_BRAZE_SYNC`
 * and mapped via `UPMIND_TO_BRAZE_MAP`) are synced to corresponding Braze subscription groups.
 */
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import Header from '@/components/dashboard/Header';
import Sidebar from '@/components/dashboard/Sidebar';
import BrazeService from '@/lib/services/braze';
import {
    UPMIND_TO_BRAZE_MAP,
    RELEVANT_UPMIND_TOPICS_FOR_BRAZE_SYNC
} from '@/config/brazeConfig';
import { TOPICS_DATA, CHANNELS_DATA } from '@/config/notificationData'; // Static data for notification topics and channels.

// Base URL for the Upmind API. Sourced from environment variables.
const UPMIND_API_BASE_URL = process.env.NEXT_PUBLIC_UPMIND_API_BASE_URL;
// Fallback for local development if the environment variable is not set.
// It's recommended to always have environment variables properly configured.
const API_BASE = UPMIND_API_BASE_URL || 'https://api.upmind.io';

/**
 * @interface UserInfo
 * @description Defines the structure for basic user information displayed in the UI.
 */
interface UserInfo {
    name: string;
    initials: string;
    email: string;
}

/**
 * @interface OptOutRecord
 * @description Defines the structure of an opt-out record fetched from the Upmind API.
 */
interface OptOutRecord {
  topic_id: string;
  channel_id: string;
  // Add other properties if known or expected from the API
}

/**
 * @interface Preferences
 * @description Defines the structure for storing user preferences, mapping a composite key (topicId_channelId) to a boolean value (true for opted-in, false for opted-out).
 */
interface Preferences {
    [key: string]: boolean;
}

/**
 * @component AuthLoadingSpinner
 * @description A spinner component displayed while authentication status is being verified.
 * @returns {React.ReactElement} The loading spinner UI.
 */
const AuthLoadingSpinner = () => (
    <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-solid border-brand-blue border-t-transparent"></div>
    </div>
);

/**
 * @component ContentLoadingSpinner
 * @description A spinner component displayed while page content (e.g., preferences) is loading.
 * @returns {React.ReactElement} The loading spinner UI.
 */
const ContentLoadingSpinner = () => (
    <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-solid border-brand-blue border-t-transparent"></div>
    </div>
);

/**
 * @page NotificationPreferencesPage
 * @description Main component for the Notification Preferences page.
 * Handles user authentication, fetching current notification opt-outs from Upmind, displaying these preferences,
 * allowing users to modify them, and saving changes back to Upmind. It also orchestrates the synchronization
 * of relevant preference changes to Braze subscription groups to ensure consistency across platforms.
 * @returns {React.ReactElement} The notification preferences page UI.
 */
export default function NotificationPreferencesPage() {
    const { isAuthenticated, isLoadingAuth, logout } = useAuth();
    const router = useRouter();

    const uEmail = useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('userEmail') || '' : '', []);
    const uFirstName = useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('userFirstName') : null, []);
    const uLastName = useMemo(() => typeof window !== 'undefined' ? localStorage.getItem('userLastName') : null, []);

    // State for storing and displaying basic user information (name, initials, email).
    const [userInfo, setUserInfo] = useState<UserInfo>({ name: 'User', initials: 'XX', email: '' });
    // State to manage the visibility of the mobile sidebar.
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // State for the current notification preferences being edited by the user.
    const [preferences, setPreferences] = useState<Preferences>({});
    // State to store the initial preferences fetched from the server, used to detect changes.
    const [initialPreferences, setInitialPreferences] = useState<Preferences>({});
    // State to indicate if the main page content (preferences) is currently loading.
    const [isLoadingPage, setIsLoadingPage] = useState(true);
    // State to store and display any error messages encountered during API calls or other operations.
    const [error, setError] = useState<string | null>(null);
    // State to track the status of the save operation ('idle', 'saving', 'success', 'error').
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    // Effect to handle redirection if the user is not authenticated.
    useEffect(() => {
        if (!isLoadingAuth && !isAuthenticated) {
            router.replace('/'); // Redirect to home or login page.
        }
    }, [isAuthenticated, isLoadingAuth, router]);

    // Effect to derive and set user information (name, initials) from localStorage.
    useEffect(() => {
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
    }, [uEmail, uFirstName, uLastName]);

    /**
     * @function fetchUserOptOuts
     * @description Fetches the user's current notification opt-out settings from the Upmind API.
     * Populates the `preferences` and `initialPreferences` state.
     * @param {boolean} [isInitialFetch=false] - Flag to indicate if this is the initial fetch when the page loads.
     *                                           Controls the `isLoadingPage` state.
     */
    const fetchUserOptOuts = useCallback(async (isInitialFetch = false) => {
        if (isInitialFetch) setIsLoadingPage(true);
        setError(null);
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (!token) {
            setError("Authentication token not found. Please log in.");
            if (isInitialFetch) setIsLoadingPage(false);
            router.replace('/');
            return;
        }
        try {
            const response = await fetch(`${API_BASE}/api/notifications/opt-outs`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Upmind API: ${errorData.message || 'Failed to fetch preferences'}`);
            }
            const result = await response.json();
            const fetchedOptOuts = result.data || [];
            const currentPrefs: Preferences = {};
            CHANNELS_DATA.forEach(channel => {
                TOPICS_DATA.forEach(topic => {
                    const key = `${topic.id}_${channel.id}`;
                    if (!topic.can_opt_out) {
                        currentPrefs[key] = true;
                    } else {
                        currentPrefs[key] = !fetchedOptOuts.some(
                            (optOut: OptOutRecord) => optOut.topic_id === topic.id && optOut.channel_id === channel.id
                        );
                    }
                });
            });
            setPreferences(currentPrefs);
            setInitialPreferences(currentPrefs);
        } catch (error: unknown) {
            const err = error as { message?: string };
            console.error("Error fetching notification preferences:", err);
            setError(err.message || "An unexpected error occurred while fetching preferences.");
            setSaveStatus('error');
        } finally {
            if (isInitialFetch) setIsLoadingPage(false);
        }
    }, [router]);

    // Effect to fetch user opt-outs when the component mounts and the user is authenticated.
    useEffect(() => {
        if (isAuthenticated) {
            fetchUserOptOuts(true); // `true` indicates this is the initial fetch.
        }
    }, [fetchUserOptOuts, isAuthenticated]);

    /**
     * @function handlePreferenceChange
     * @description Updates the local `preferences` state when a user toggles a checkbox for a specific topic and channel.
     * @param {string} topicId - The ID of the notification topic.
     * @param {string} channelId - The ID of the notification channel.
     * @param {boolean} isChecked - The new state of the checkbox (true for opted-in, false for opted-out).
     */
    const handlePreferenceChange = (topicId: string, channelId: string, isChecked: boolean) => {
        setPreferences(prev => ({ ...prev, [`${topicId}_${channelId}`]: isChecked }));
        setSaveStatus('idle');
    };

    /**
     * @function handleSelectAll
     * @description Handler for the 'Select All' action for a given topic.
     * Opts the user into all channels for a specific opt-outable topic.
     * @param {string} topicId - The ID of the notification topic.
     */
    const handleSelectAll = (topicId: string) => {
        const newPrefs = { ...preferences };
        const topic = TOPICS_DATA.find(t => t.id === topicId);
        if (topic && topic.can_opt_out) {
            CHANNELS_DATA.forEach(channel => {
                newPrefs[`${topicId}_${channel.id}`] = true;
            });
            setPreferences(newPrefs);
            setSaveStatus('idle');
        }
    };

    /**
     * @function handleClearAll
     * @description Handler for the 'Clear All' (Deselect All) action for a given topic.
     * Opts the user out of all channels for a specific opt-outable topic.
     * @param {string} topicId - The ID of the notification topic.
     */
    const handleClearAll = (topicId: string) => {
        const newPrefs = { ...preferences };
        const topic = TOPICS_DATA.find(t => t.id === topicId);
        if (topic && topic.can_opt_out) {
            CHANNELS_DATA.forEach(channel => {
                newPrefs[`${topicId}_${channel.id}`] = false;
            });
            setPreferences(newPrefs);
            setSaveStatus('idle');
        }
    };

    /**
     * @async
     * @function handleSavePreferences
     * @description Saves the user's modified notification preferences.
     * This involves:
     * 1. Constructing a payload of opt-out records for the Upmind API.
     * 2. Calling the Upmind API to update these opt-outs.
     * 3. Constructing a payload for Braze subscription group updates based on relevant Upmind preferences.
     * 4. Calling `BrazeService.updateSubscriptionGroups()` to sync with Braze.
     * 5. Updating local state (`initialPreferences`) and UI feedback (save status, errors).
     */
    const handleSavePreferences = async () => {
        setSaveStatus('saving');
        setError(null);
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

        if (!token) {
            setError("Authentication token missing. Please log in again.");
            setSaveStatus('error');
            // Consider redirecting to login if token is critical and missing
            // router.replace('/'); 
            return;
        }

        // Capture states for diffing and API calls
        const currentPreferencesSnapshot = { ...preferences };
        const originalInitialPreferences = { ...initialPreferences }; // State before user made changes for THIS save operation

        const optOutsPayloadUpmind: { topic_id: string; channel_id: string }[] = [];
        const brazeSubscriptionUpdatesSDK: Record<string, "subscribed" | "unsubscribed"> = {};

        TOPICS_DATA.forEach(topic => {
            CHANNELS_DATA.forEach(channel => {
                const prefKey = `${topic.id}_${channel.id}`;
                const isOptedIn = currentPreferencesSnapshot[prefKey]; // Use snapshot of current desired state
                
                // For Upmind API: if it's an opt-outable topic and user is NOT opted in (i.e., opted out)
                if (topic.can_opt_out && !isOptedIn) {
                    optOutsPayloadUpmind.push({ topic_id: topic.id, channel_id: channel.id });
                }

                // For Braze SDK sync: if it's a relevant topic for Braze
                if (RELEVANT_UPMIND_TOPICS_FOR_BRAZE_SYNC.includes(topic.id)) {
                    const brazeGroupId = UPMIND_TO_BRAZE_MAP[topic.id]?.[channel.id];
                    if (brazeGroupId) {
                        brazeSubscriptionUpdatesSDK[brazeGroupId] = isOptedIn ? "subscribed" : "unsubscribed";
                    }
                }
            });
        });

        try {
            // Step 1: Update Upmind preferences
            const upmindResponse = await fetch(`${API_BASE}/api/notifications/opt-outs`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ opt_outs: optOutsPayloadUpmind }),
            });

            if (!upmindResponse.ok) {
                const errorData = await upmindResponse.json().catch(() => ({}));
                throw new Error(`Upmind API Error: ${errorData.message || 'Failed to save Upmind preferences'}`);
            }
            
            // Step 2: Update Braze Subscription Groups via SDK (if applicable)
            if (Object.keys(brazeSubscriptionUpdatesSDK).length > 0) {
                if (BrazeService.isInitialized) {
                    console.log("Attempting to update Braze subscription groups via SDK:", brazeSubscriptionUpdatesSDK);
                    BrazeService.updateUserSubscriptionGroupsViaSDK(brazeSubscriptionUpdatesSDK);
                    console.log("Braze SDK: updateUserSubscriptionGroupsViaSDK call initiated. Check Braze dashboard for confirmation.");
                } else {
                    console.warn("Braze SDK not initialized; skipping Braze subscription group update.");
                }
            }

            // Step 3: Log Braze custom event for preference updates
            const changedPreferencesForBrazeEvent: Array<{
                topic_id: string;
                channel_id: string;
                old_state_opted_in: boolean | undefined; // old state might not exist if key is new
                new_state_opted_in: boolean | undefined;
            }> = [];

            // Iterate over all possible keys (from topics and channels) or use a combined set of keys from both snapshots
            const allKeys = new Set([...Object.keys(currentPreferencesSnapshot), ...Object.keys(originalInitialPreferences)]);

            allKeys.forEach(key => {
                const newOptInState = currentPreferencesSnapshot[key];
                const oldOptInState = originalInitialPreferences[key];

                if (newOptInState !== oldOptInState) { // A change occurred
                    const [topicId, channelId] = key.split('_');
                    changedPreferencesForBrazeEvent.push({
                        topic_id: topicId,
                        channel_id: channelId,
                        old_state_opted_in: oldOptInState,
                        new_state_opted_in: newOptInState
                    });
                }
            });

            if (changedPreferencesForBrazeEvent.length > 0) {
                const eventProperties = {
                    updated_preferences_details_json: JSON.stringify(changedPreferencesForBrazeEvent),
                    number_of_changes: changedPreferencesForBrazeEvent.length
                };
                BrazeService.logCustomEvent('Notification Preference Updated', eventProperties);
                console.log('NotificationPreferencesPage: Logged Braze event "Notification Preference Updated"', eventProperties);
            }

            // Step 4: Update UI and local state on success
            setSaveStatus('success');
            setInitialPreferences({ ...currentPreferencesSnapshot }); // Update initial state to the successfully saved state
            // Optionally, re-fetch from Upmind to ensure full consistency, though the PUT response should suffice.
            // fetchUserOptOuts(false);
            setTimeout(() => setSaveStatus('idle'), 3000);

        } catch (error: unknown) {
            const err = error as { message?: string };
            console.error("Error saving notification preferences:", err);
            setError(err.message || "An unexpected error occurred while saving preferences.");
            setSaveStatus('error');
            // Do not revert initialPreferences here, as 'preferences' still holds the user's desired (but failed) state.
            // The user can choose to try saving again or revert manually.
            setTimeout(() => setSaveStatus('idle'), 5000);
        }
    };

    const handleRevertChanges = () => {
        setPreferences(initialPreferences);
        setSaveStatus('idle');
        setError(null);
    };

    const hasChanges = useMemo(() => JSON.stringify(preferences) !== JSON.stringify(initialPreferences), [preferences, initialPreferences]);
    const toggleMobileSidebar = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);

    if (isLoadingAuth || (!isAuthenticated && typeof window !== 'undefined')) {
        return <AuthLoadingSpinner />;
    }

    return (
        <div className="flex h-screen bg-brand-gray-light">
            <Sidebar 
                isMobileOpen={isMobileSidebarOpen} 
                toggleMobileSidebar={() => setIsMobileSidebarOpen(false)}
                onLogout={() => { logout(); router.push('/'); }}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    onToggleMobileSidebar={toggleMobileSidebar} 
                    userInfo={userInfo} 
                    onLogout={() => { logout(); router.push('/'); }}
                    onBellClick={() => console.log('Bell clicked')} // Placeholder
                    hasUnreadNotification={false} // Placeholder
                    isNotificationPopupVisible={false} // Placeholder
                    onNotificationClose={() => {}} // Placeholder
                    onNotificationSignUp={() => {}} // Placeholder
                    onNotificationAskLater={() => {}} // Placeholder
                    notificationCount={0} // Placeholder for actual count
                />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-gray-light p-10 md:p-12 pt-[calc(60px+0.5rem)] md:pt-[calc(60px+0.75rem)] pb-[60px]">
                        <h1 className="text-2xl md:text-3xl font-semibold text-brand-gray-text mb-2">Notification Preferences</h1>
                        <p className="text-sm md:text-base text-brand-gray-textMedium mb-4 md:mb-6">
                            Manage how we contact you. Changes are saved per channel (Email, In-App).
                        </p>

                        {isLoadingPage ? (
                            <ContentLoadingSpinner />
                        ) : error && !isLoadingPage ? ( // Show error only if not loading and error exists
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                                <p className="font-bold">Error</p>
                                <p>{error}</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                {TOPICS_DATA.map((topic) => (
                                    <div key={topic.id} className="bg-white shadow-md rounded-lg mb-4">
                                        <div className="p-3 md:p-4 border-b border-gray-200">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg md:text-xl font-semibold text-brand-gray-text">{topic.name}</h3>
                                                    <p className="text-xs md:text-sm text-brand-gray-textMedium mt-1">{topic.description}</p>
                                                </div>
                                                {topic.can_opt_out && (() => {
                                                    const isTopicFullySelected = CHANNELS_DATA.every(channel => preferences[`${topic.id}_${channel.id}`]);
                                                    return (
                                                        <div className="mt-2 sm:mt-0 flex-shrink-0">
                                                            {isTopicFullySelected ? (
                                                                <button onClick={() => handleClearAll(topic.id)} className="text-xs text-brand-blue hover:underline whitespace-nowrap">Clear All</button>
                                                            ) : (
                                                                <button onClick={() => handleSelectAll(topic.id)} className="text-xs text-brand-blue hover:underline whitespace-nowrap">Select All</button>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        <div className="p-3 md:p-4">
                                            {CHANNELS_DATA.map((channel) => {
                                                const preferenceKey = `${topic.id}_${channel.id}`;
                                                const isDisabled = !topic.can_opt_out;
                                                return (
                                                    <div key={channel.id} className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100 last:mb-0 last:pb-0 last:border-b-0">
                                                        <label htmlFor={preferenceKey} className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-brand-gray-textMedium'}`}>
                                                            {channel.name}
                                                        </label>
                                                        <input
                                                            type="checkbox"
                                                            id={preferenceKey}
                                                            name={preferenceKey}
                                                            checked={preferences[preferenceKey] || false}
                                                            onChange={(e) => handlePreferenceChange(topic.id, channel.id, e.target.checked)}
                                                            disabled={isDisabled}
                                                            className="form-checkbox h-5 w-5 text-brand-green rounded border-gray-300 focus:ring-2 focus:ring-brand-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                                </div> {/* This closes the grid div */}
                            </> // Closes the fragment for content
                        )} {/* Closes the main ternary operator (isLoadingPage ? ... : error ? ... : ... ) */}

                        {/* Render the form only if not loading and no error */}
                        {!isLoadingPage && !error && (
                            <form onSubmit={(e) => { e.preventDefault(); handleSavePreferences(); }} className="sticky bottom-0 p-3 border-t border-gray-200 z-10">
                                    {/* Save Status Messages */}
                                    {saveStatus === 'success' && (
                                        <p className="mb-4 text-sm text-green-600 p-3 bg-green-50 border border-green-200 rounded-md">
                                            Preferences saved successfully!
                                        </p>
                                    )}
                                    {saveStatus === 'error' && error && error.length > 0 && (
                                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                                            <span className="font-bold">Error:</span> {error}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                                        <button
                                            type="button"
                                            onClick={handleRevertChanges}
                                            disabled={!hasChanges || saveStatus === 'saving'}
                                            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50"
                                        >
                                            Revert Changes
                                        </button>
                                        <button
                                            type="submit" 
                                            disabled={!hasChanges || saveStatus === 'saving' || saveStatus === 'success'}
                                            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand-green border border-transparent rounded-md shadow-sm hover:bg-brand-green-darker focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50"
                                        >
                                            {saveStatus === 'saving' ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                'Save Preferences'
                                            )}
                                        </button>
                                    </div>
                                </form>
                        )}
                </main>
            </div>
        </div>
    );
}
