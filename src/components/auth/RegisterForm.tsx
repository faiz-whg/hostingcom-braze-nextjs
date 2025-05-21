/**
 * @file RegisterForm.tsx
 * @description Client component for user registration. Handles form input, validation,
 * registration with Upmind via a backend API, fetching initial Upmind notification preferences,
 * and setting up the user in Braze with attributes and subscription groups.
 */
'use client';

// src/components/auth/RegisterForm.tsx
import React, { useState } from 'react';
import BrazeService from '@/lib/services/braze'; // Updated path
import { 
    UPMIND_TO_BRAZE_MAP, 
    RELEVANT_UPMIND_TOPICS_FOR_BRAZE_SYNC 
} from '@/config/brazeConfig'; 

// @TODO: Consolidate these Upmind constants. They are duplicated from other parts of the application (e.g., notification-preferences page).
/**
 * @interface UpmindChannel
 * @description Represents an Upmind notification channel (e.g., Email, In-App).
 */
interface UpmindChannel {
    id: string;
    name: string;
}
/** @const UPMIND_CHANNELS_DATA_REG Local copy of Upmind channel data for this component. */
const UPMIND_CHANNELS_DATA_REG: UpmindChannel[] = [ // Local copy for this component
    { id: "3d6d5308-7682-51d4-87c1-47e390921e61", name: "Email" },
    { id: "d15196e0-2e51-36d4-29b0-429807875d30", name: "In-App" },
];
/**
 * @interface UpmindTopic
 * @description Represents an Upmind notification topic (e.g., System, Billing, Marketing).
 */
interface UpmindTopic {
    id: string;
    name: string;
    can_opt_out: boolean;
}
/** @const UPMIND_TOPICS_DATA_REG Local copy of Upmind topic data for this component. */
const UPMIND_TOPICS_DATA_REG: UpmindTopic[] = [ // Local copy for this component
    { id: "3d6d5308-7682-51d4-87c1-47e390921e61", name: "System", can_opt_out: false },
    { id: "26e2e071-d931-d5e4-68a6-460287583960", name: "Billing", can_opt_out: true },
    { id: "d15196e0-2e51-36d4-29b0-429807875d30", name: "Marketing", can_opt_out: true },
    { id: "e57052d1-37e0-8d24-13f5-495163789e68", name: "Support", can_opt_out: true },
    { id: "31261e50-9897-3d24-79ce-45e610832d75", name: "Service Updates", can_opt_out: true },
];


const API_URL = '/api'; // Base URL for internal API routes.
// Base URL for direct Upmind API calls (e.g., fetching opt-outs).
// Note: This should ideally be sourced from `process.env.NEXT_PUBLIC_UPMIND_API_BASE_URL` for consistency and configurability.
const UPMIND_API_BASE_URL = process.env.NEXT_PUBLIC_UPMIND_API_BASE_URL || 'https://api.upmind.io';

/**
 * @interface PasswordStrength
 * @description Represents the visual state and text for password strength indication.
 */
/**
 * @interface PasswordStrength
 * @description Represents the visual state and text for password strength indication.
 * Used by `checkPasswordStrengthUtil` to provide feedback on password complexity.
 */
interface PasswordStrength {
    className: string;
    text: string;
    width: string;
}

/**
 * @function checkPasswordStrengthUtil
 * @description Utility function to evaluate password strength and return corresponding UI state.
 * @param {string} password - The password string to evaluate.
 * @returns {PasswordStrength} Object containing CSS class, text, and width for strength indicator.
 */
/**
 * @function checkPasswordStrengthUtil
 * @description Utility function to evaluate password strength based on length, character types (uppercase, lowercase, numbers, symbols).
 * @param {string} password - The password string to evaluate.
 * @returns {PasswordStrength} Object containing CSS class (`className`), descriptive text (`text`), and a Tailwind CSS width class (`width`) for rendering a strength indicator bar.
 */
const checkPasswordStrengthUtil = (password: string): PasswordStrength => {
    if (password.length === 0) return { className: '', text: '', width: 'w-0' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    else if (/[a-zA-Z]/.test(password)) score += 0.5;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score < 2) return { className: 'bg-red-500', text: 'Weak', width: 'w-1/3' };
    if (score < 3.5) return { className: 'bg-yellow-500', text: 'Medium', width: 'w-2/3' };
    return { className: 'bg-green-500', text: 'Strong', width: 'w-full' };
};


/**
 * @interface RegisterFormProps
 * @description Props for the RegisterForm component.
 */
interface RegisterFormProps {
  onSuccess: (email?: string) => void;
  switchToLogin: () => void;
}

/**
 * @component RegisterForm
 * @description A form component for user registration.
 * Handles user input, communicates with the backend for Upmind registration,
 * fetches initial notification preferences, and initializes the user in Braze.
 * @param {RegisterFormProps} props - The component's props.
 * @param {function} props.onSuccess - Callback function invoked upon successful registration.
 * @param {function} props.switchToLogin - Callback function to switch to the login form view.
 */
const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, switchToLogin }) => {
  // State for form input fields.
  /** 
   * @state formData 
   * @description Stores the values of the registration form input fields (firstname, lastname, email, password, etc.).
   * @type {Object<string, string>}
   */
  const [formData, setFormData] = useState<{ [key: string]: string }>({
    firstname: '', lastname: '', email: '', password: '', confirmPassword: '', phoneCode: '', phone: '',
  });
  // State for displaying error messages to the user.
  /** 
   * @state error 
   * @description Stores error messages to be displayed to the user during the registration process.
   * @type {string}
   */
  const [error, setError] = useState<string>('');
  // State for displaying success messages to the user.
  /** 
   * @state successMsg 
   * @description Stores success messages to be displayed to the user, typically after successful registration.
   * @type {string}
   */
  const [successMsg, setSuccessMsg] = useState<string>('');
  // State to manage loading indicators during API calls.
  /** 
   * @state isLoading 
   * @description Manages the loading state, typically set to true during API calls (registration, fetching preferences).
   * @type {boolean}
   */
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // State for the password strength indicator UI.
  /** 
   * @state passwordStrength 
   * @description Stores the current password strength assessment for UI display, based on `checkPasswordStrengthUtil`.
   * @type {PasswordStrength}
   */
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ className: '', text: '', width: 'w-0' });


  /**
   * @function handleChange
   * @description Handles changes in form input fields, updating the form data state.
   * Also triggers password strength check if the password field is changed.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: { [key: string]: string }) => ({ ...prev, [name]: value }));
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrengthUtil(value));
    }
  };

  /**
   * @async
   * @function handleSubmit
   * @description Handles the form submission for user registration.
   * This involves multiple steps:
   * 1. Basic client-side validation.
   * 2. Calling the backend API (`/api/auth/register`) to register the user with Upmind.
   * 3. If Upmind registration is successful, temporarily logging in the new user via `/api/auth/login` 
   *    to obtain an access token. This token is Upmind's, not directly Braze's.
   * 4. Using the temporary Upmind access token to fetch the user's initial notification opt-out settings directly from Upmind API.
   * 5. Mapping these Upmind preferences to Braze subscription group states.
   * 6. Initializing/updating the user in Braze using `BrazeService.changeUser`, passing attributes and the derived subscription states.
   *    The Upmind user ID (referred to as `actorIdForBrazeContext` here) is used as the `external_id` for Braze.
   * 7. Handling success and error states throughout the process.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log('RegisterForm: handleSubmit entered.'); // New simple log
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    // Basic client-side validation for password length.
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      console.log('RegisterForm: Assembling payload.'); // Log before payload
      // Prepare payload for Upmind registration via our backend API.
      const payload = {
        email: formData.email, firstname: formData.firstname, lastname: formData.lastname,
        password: formData.password, username: formData.email, 
        phone: formData.phone || null, phone_code: formData.phoneCode || null,
        phone_country_code: null, 
      };
      // Step 1: Call our backend API to register the user with Upmind.
      const upmindRegisterResponse = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log(`RegisterForm: Upmind registration API raw response status: ${upmindRegisterResponse.status}, ok: ${upmindRegisterResponse.ok}`);

      const responseText = await upmindRegisterResponse.text(); // Get raw text first
      console.log('RegisterForm: Upmind registration API raw response text:', responseText);

      let upmindRegisterData;
      try {
        upmindRegisterData = JSON.parse(responseText); // Try to parse
        // Safely stringify, handling potential large objects or issues
        let upmindDataString = 'Could not stringify upmindRegisterData';
        try { upmindDataString = JSON.stringify(upmindRegisterData); } catch (e) { console.error('Error stringifying upmindRegisterData:', e); }
        console.log('RegisterForm: Parsed Upmind registration API response data (upmindRegisterData):', upmindDataString);
      } catch (parseError) {
        console.error('RegisterForm: Failed to parse Upmind registration API response text as JSON.', parseError);
        console.error('RegisterForm: Raw text that failed to parse:', responseText);
        setError('Registration data from server was not valid. Please try again.');
        setIsLoading(false);
        return;
      }

      // Check if the backend API call was successful and Upmind registration was confirmed (success: true and user ID present).
      if (upmindRegisterResponse.ok && upmindRegisterData && upmindRegisterData.success === true && upmindRegisterData.data && upmindRegisterData.data.id) {
        console.log("RegisterForm: Upmind registration successful via backend API. Upmind user data:", JSON.stringify(upmindRegisterData.data));
        
        // Upmind registration successful. actorIdForBrazeContext will store the Upmind user ID for Braze external_id.
        const actorIdForBrazeContext: string | null = upmindRegisterData.data.id;
        console.log('RegisterForm: actorIdForBrazeContext set from Upmind registration data:', actorIdForBrazeContext);

      // Log custom event to Braze for successful registration
      BrazeService.logCustomEvent('User Registered');
      console.log('RegisterForm: Logged Braze custom event: User Registered');

        // Now, attempt to fetch initial Upmind notification preferences.
        // This requires a temporary login to get an Upmind access token for the new user.
        const initialUpmindPrefs: { [key: string]: boolean } = {};

        // Introduce a delay before attempting temporary login
        console.log('RegisterForm: Upmind registration successful. Waiting for 10 seconds before temporary login to allow credentials to activate...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3-second delay
        console.log('RegisterForm: Delay finished. Attempting temporary login.');

        // Step 2: Temporarily log in the new user to get their Upmind access token and actor_id (Upmind user ID).
        const loginResponse = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: formData.email, password: formData.password })
        });
        const loginData = await loginResponse.json();
        console.log('RegisterForm: Temporary login API response data:', JSON.stringify(loginData));

        if (loginResponse.ok && loginData.success && loginData.data && loginData.data.access_token && loginData.data.actor_id) {
            const accessToken = loginData.data.access_token;
            // actorIdForBrazeContext is already set from registration data. Verify if it matches.
            if (actorIdForBrazeContext !== loginData.data.actor_id) {
                console.warn(`RegisterForm: Mismatch in Upmind ID. Reg: ${actorIdForBrazeContext}, Login: ${loginData.data.actor_id}. Using ID from registration.`);
            }
            console.log('RegisterForm: Temporary login successful. Using actorIdForBrazeContext:', actorIdForBrazeContext);

            // Step 3: Fetch initial Upmind notification opt-out settings for the new user using their Upmind token.
            console.log("RegisterForm: Fetching initial Upmind opt-outs for new user with temp token...");
            const optOutsResponse = await fetch(`${UPMIND_API_BASE_URL}/api/notifications/opt-outs`, {
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
            });
            if (optOutsResponse.ok) {
                const optOutsResult = await optOutsResponse.json();
                interface UpmindOptOut {
                    topic_id: string;
                    channel_id: string;
                }
                const fetchedOptOuts: UpmindOptOut[] = optOutsResult.data || [];
                UPMIND_TOPICS_DATA_REG.forEach(topic => { // Use local copy
                    UPMIND_CHANNELS_DATA_REG.forEach(channel => { // Use local copy
                        const key = `${topic.id}_${channel.id}`;
                        initialUpmindPrefs[key] = !topic.can_opt_out || !fetchedOptOuts.some(
                            (optOut: UpmindOptOut) => optOut.topic_id === topic.id && optOut.channel_id === channel.id
                        );
                    });
                });
            } else {
                console.warn("Could not fetch initial Upmind opt-outs. Assuming opt-in for relevant groups.");
                RELEVANT_UPMIND_TOPICS_FOR_BRAZE_SYNC.forEach(topicId => {
                    UPMIND_CHANNELS_DATA_REG.forEach(channel => { initialUpmindPrefs[`${topicId}_${channel.id}`] = true; });
                });
            }
        } else {
            // Fallback if temporary login or opt-out fetch fails: assume default opt-in for relevant Braze groups.
            console.warn("Could not auto-login new user to fetch Upmind opt-outs. Assuming opt-in for Braze subscription groups.");
            RELEVANT_UPMIND_TOPICS_FOR_BRAZE_SYNC.forEach(topicId => {
                UPMIND_CHANNELS_DATA_REG.forEach(channel => { initialUpmindPrefs[`${topicId}_${channel.id}`] = true; });
            });
        }

        // Step 4: Map the fetched/defaulted Upmind preferences to Braze subscription group states.
        const brazeSubscriptionStatesForSDK: { [key: string]: "subscribed" | "unsubscribed" } = {}; 
        RELEVANT_UPMIND_TOPICS_FOR_BRAZE_SYNC.forEach(upmindTopicId => {
            UPMIND_CHANNELS_DATA_REG.forEach(upmindChannel => { // Renamed variable for clarity
                const brazeGroupId = UPMIND_TO_BRAZE_MAP[upmindTopicId]?.[upmindChannel.id]; // Use upmindChannel.id
                if (brazeGroupId) {
                    const isOptedInUpmind = initialUpmindPrefs[`${upmindTopicId}_${upmindChannel.id}`]; // Use upmindChannel.id
                    brazeSubscriptionStatesForSDK[brazeGroupId] = isOptedInUpmind ? "subscribed" : "unsubscribed";
                }
            });
        });
        // Step 5: Initialize the user in Braze.
        // actorIdForBrazeContext (Upmind user ID) will be used as the Braze external_id.
        // brazeSubscriptionStatesForSDK contains the subscription group states derived from Upmind preferences.
        if (actorIdForBrazeContext && BrazeService.isInitialized) {
              console.log(`RegisterForm: Setting up Braze user profile for user ID: ${actorIdForBrazeContext}`);
              const brazeAttributes = {
                firstName: formData.firstname,
                lastName: formData.lastname,
                email: formData.email,
                // Add any other custom attributes derived from formData or upmindRegisterData.data
              };
              console.log('RegisterForm: brazeSubscriptionStatesForSDK to be sent:', JSON.stringify(brazeSubscriptionStatesForSDK, null, 2));

              // Single call to BrazeService to change user, set attributes, and update subscriptions
              // Call BrazeService.changeUser to set user attributes and update subscription groups in one go.
              const changeUserSuccess = BrazeService.changeUser(
                actorIdForBrazeContext, // This is the Upmind user ID, used as Braze external_id.
                brazeAttributes,
                brazeSubscriptionStatesForSDK
              );

              if (changeUserSuccess) {
                console.log('RegisterForm: Braze user attributes and subscription groups setup successful.');
                setSuccessMsg('Registration and initial preferences setup successful! Redirecting...');
                onSuccess(formData.email); // Notify parent component of full success.
              } else {
                // Braze changeUser reported an issue (e.g., one or more subscription updates failed).
                // Upmind registration was successful, but the Braze part is incomplete.
                console.warn('RegisterForm: Braze user setup (changeUser or subscriptions) reported an issue. Registration completed with Upmind, but review Braze sync.');
                setSuccessMsg('Registration successful! However, there was an issue syncing all your preferences. We will look into it.');
                // setError('Upmind registration complete, but there was an issue setting up your Braze profile. We will look into it.');
                // Decide if this is still a full success for the parent component.
                // For now, let's consider Upmind registration the primary success for `onSuccess` callback.
                onSuccess(formData.email);
              }
            } else if (!BrazeService.isInitialized) {
                // Braze SDK was not initialized; Upmind registration was successful.
                console.warn("RegisterForm: Braze SDK not initialized. Skipping Braze user setup. Upmind registration was successful.");
                setSuccessMsg('Registration successful! Some features requiring Braze will be enabled later.');
                // setError('Upmind registration complete. Braze SDK is not ready, profile will sync later.');
                onSuccess(formData.email); 
            } else if (!actorIdForBrazeContext) {
                // Critical issue: Upmind user ID (for Braze external_id) was not obtained after successful Upmind registration and temporary login.
                console.error("RegisterForm: actorIdForBrazeContext is missing after Upmind registration/login. Cannot set up Braze user.");
                setSuccessMsg('Registration with Upmind successful, but an internal error occurred preventing full profile setup.');
                // setError('Upmind registration complete, but an internal error occurred preventing Braze setup.');
                onSuccess(formData.email); // Upmind part was okay.
            }
        } else {
            // Handle Upmind registration failure reported by our backend API (`/api/auth/register`).
            const errorMsg = upmindRegisterData?.error || 'Registration failed. Please try again.';
            console.error('RegisterForm: Upmind registration failed via backend API.', errorMsg, JSON.stringify(upmindRegisterData));
            setError(errorMsg);
        }
    } catch (error: unknown) { // Catch any unexpected error during the handleSubmit process.
      console.error('RegisterForm: An unexpected error occurred during handleSubmit:', error);
      let displayError = 'An unexpected error occurred during registration. Please try again.';
      if (error instanceof Error) {
        displayError = error.message;
      } else if (typeof error === 'string') {
        displayError = error;
      } else if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
        displayError = (error as { message: string }).message;
      }
      setError(displayError);
    } finally {
      setIsLoading(false); // Ensure loading state is reset.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-3xl font-semibold text-center text-gray-700 mb-6">Create Account</h2>
      {error && <div className="p-3 bg-red-100 text-red-700 border border-red-200 rounded-md text-sm">{error}</div>}
      {successMsg && <div className="p-3 bg-green-100 text-green-700 border border-green-200 rounded-md text-sm">{successMsg}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
          <input type="text" name="firstname" value={formData.firstname} onChange={handleChange} required className="input-auth" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
          <input type="text" name="lastname" value={formData.lastname} onChange={handleChange} required className="input-auth" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-auth" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} required className="input-auth" />
        <div className={`strength-indicator-base ${passwordStrength.width} ${passwordStrength.className}`}></div>
        <p className="text-xs text-gray-500 mt-1">Use at least 8 characters with letters and numbers. {passwordStrength.text && <span className={`font-medium ${passwordStrength.className.includes('red') ? 'text-red-500' : passwordStrength.className.includes('yellow') ? 'text-yellow-600' : 'text-green-600'}`}>{passwordStrength.text}</span>}</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="input-auth" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
        <div className="flex gap-2.5">
          <input type="text" name="phoneCode" placeholder="+1" value={formData.phoneCode} onChange={handleChange} className="input-auth w-24" />
          <input type="tel" name="phone" placeholder="123-456-7890" value={formData.phone} onChange={handleChange} className="input-auth flex-1" />
        </div>
      </div>
      <button type="submit" disabled={isLoading} className="w-full py-3.5 px-4 bg-gradient-to-r from-[#7fff8a] to-[#b8ff5b] text-gray-800 font-semibold rounded-md shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 text-lg">
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>
      <div className="text-center text-sm text-gray-500 mt-8">
        <p>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); switchToLogin(); }} className="text-gray-400 hover:text-gray-600 underline">Sign in</a></p>
      </div>
    </form>
  );
};

export default RegisterForm;