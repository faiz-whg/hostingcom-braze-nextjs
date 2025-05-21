'use client';

// src/components/auth/LoginForm.tsx
import React, { useState } from 'react';
import BrazeService from '@/lib/services/braze'; // Updated path

// Types for props
/**
 * @interface LoginFormProps
 * @description Defines the props accepted by the `LoginForm` component.
 */
interface LoginFormProps {
  /**
   * @property onSuccess
   * @description Callback function invoked upon successful login.
   * It passes the access token and an optional refresh token to the parent component.
   * @param {string} accessToken - The access token received from the authentication API.
   * @param {string} [refreshToken] - The optional refresh token received from the authentication API.
   */
  onSuccess: (accessToken: string, refreshToken?: string) => void;
  /**
   * @property switchToRegister
   * @description Callback function to switch the view to the registration form.
   */
  switchToRegister: () => void;
}

const API_URL = '/api';

/**
 * @component LoginForm
 * @description A form component for user login. It handles user input for email and password,
 * submits credentials to a login API endpoint, manages loading and error states,
 * interacts with `localStorage` for user details, and integrates with `BrazeService`
 * to identify the user and update their attributes and subscriptions upon successful login.
 * @param {LoginFormProps} props - The props for the component.
 * @param {function} props.onSuccess - Callback invoked on successful login, passing access and refresh tokens.
 * @param {function} props.switchToRegister - Callback to switch to the registration form view.
 */
const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, switchToRegister }) => {
  /** @state {string} email - Stores the user's email input. */
  const [email, setEmail] = useState<string>('');
  /** @state {string} password - Stores the user's password input. */
  const [password, setPassword] = useState<string>('');
  /** @state {string} error - Stores any error message to be displayed to the user. */
  const [error, setError] = useState<string>('');
  /** @state {string} successMsg - Stores any success message to be displayed to the user. */
  const [successMsg, setSuccessMsg] = useState<string>('');
  /** @state {boolean} isLoading - Tracks whether the login request is currently in progress. */
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const fetchResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password: password })
      });
      const data = await fetchResponse.json();

      if (fetchResponse.ok && data.success) {
        const authData = data.data;
        localStorage.setItem('userEmail', email);

        const regFirstName = localStorage.getItem('userFirstName');
        const regLastName = localStorage.getItem('userLastName');
        if (authData.firstname && !regFirstName) localStorage.setItem('userFirstName', authData.firstname);
        if (authData.lastname && !regLastName) localStorage.setItem('userLastName', authData.lastname);

        const actorId = authData.actor_id;
        if (actorId) {
          localStorage.setItem('actor_id', actorId);
          if (BrazeService.isInitialized) {
            const brazeUserAttributes: { email: string; firstName?: string; lastName?: string; [key: string]: unknown } = {
              email: email,
              firstName: (localStorage.getItem('userFirstName') || authData.firstname) ?? undefined,
              lastName: (localStorage.getItem('userLastName') || authData.lastname) ?? undefined,
            };
            Object.keys(brazeUserAttributes).forEach(key => {
              if (brazeUserAttributes[key] == null) {
                delete brazeUserAttributes[key];
              }
            });
            BrazeService.changeUser(actorId, brazeUserAttributes);
            console.log("LoginForm: BrazeService.changeUser called for", actorId);

            const initialBrazePrefsSDKString = localStorage.getItem('initialBrazePrefsForNewUserSDK');
            const tempActorIdFromReg = localStorage.getItem('actor_id_temp_reg');
            if (initialBrazePrefsSDKString && tempActorIdFromReg === actorId) {
              try {
                const initialBrazePrefsSDK = JSON.parse(initialBrazePrefsSDKString);
                console.log("LoginForm: Applying initial Braze subscription states via SDK:", initialBrazePrefsSDK);
                await BrazeService.updateUserSubscriptionGroupsViaSDK(initialBrazePrefsSDK);
              } catch (parseError) {
                console.error("LoginForm: Error parsing initialBrazePrefsForNewUserSDK", parseError);
              } finally {
                localStorage.removeItem('initialBrazePrefsForNewUserSDK');
                localStorage.removeItem('actor_id_temp_reg');
              }
            } else {
              console.log("LoginForm: Not a new user first login, or no initial Braze prefs found.");
            }
          } // End of BrazeService.isInitialized check

          // The 'User Logged In' event is now handled by AuthContext.
          // BrazeService.logCustomEvent('user_logged_in');
          // console.log('LoginForm: Logged Braze event "user_logged_in"');

          if (authData.access_token) {
            setSuccessMsg('Login successful! Processing...');
            onSuccess(authData.access_token, authData.refresh_token);
          } else {
            console.error('Login API response missing access_token:', authData);
            setError('Login failed: Core authentication data missing.');
          }
        } else { // else for if (actorId)
          setError('Login failed: User identifier not found in response.');
        }
      } else { // else for if (fetchResponse.ok && data.success)
        setError(data.error || data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError('Network error: ' + err.message);
      } else {
        setError('An unknown network error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-3xl font-semibold text-center text-gray-700 mb-8">Welcome Back</h2>
      {error && <div className="p-3 bg-red-100 text-red-700 border border-red-200 rounded-md text-sm">{error}</div>}
      {successMsg && <div className="p-3 bg-green-100 text-green-700 border border-green-200 rounded-md text-sm">{successMsg}</div>}
      <div>
        <label htmlFor="loginEmail" className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input type="email" id="loginEmail" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-auth" />
      </div>
      <div>
        <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Password <span className="text-red-500">*</span>
        </label>
        <input type="password" id="loginPassword" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-auth" />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 px-4 bg-gradient-to-r from-[#7fff8a] to-[#b8ff5b] text-gray-800 font-semibold rounded-md shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      <div className="text-center text-sm text-gray-500 mt-8 space-y-1">
        <p><a href="#" onClick={(e) => { e.preventDefault(); alert('Forgot password functionality not implemented yet'); }} className="text-gray-400 hover:text-gray-600 underline">Forgot password?</a></p>
        <p>New user? <a href="#" onClick={(e) => { e.preventDefault(); switchToRegister(); }} className="text-gray-400 hover:text-gray-600 underline">Create an account</a></p>
      </div>
    </form>
  );
};

export default LoginForm;

// Ensure your API at /api/auth/login returns a JSON structure like:
// Success: { success: true, data: { access_token: "your_jwt", refresh_token: "your_refresh_token", actor_id: "user_actor_id", firstname: "User", lastname: "Name" } }
// Error:   { success: false, error: "Error message", message?: "Detailed message" }