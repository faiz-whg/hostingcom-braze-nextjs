'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext'; // Using the new AuthContext
import LoginForm from './LoginForm'; // Assuming LoginForm.jsx is in the same folder
import RegisterForm from './RegisterForm'; // Assuming RegisterForm.jsx is in the same folder

/**
 * @component AuthForm
 * @description A React component that provides a tabbed interface for user authentication,
 * allowing users to switch between a login form and a registration form.
 * It utilizes `LoginForm` and `RegisterForm` components for the actual form rendering and submission logic.
 * It also interacts with the `AuthContext` to handle successful login events.
 */
const AuthForm = () => {
  /**
   * @state activeTab
   * @description Controls which form (login or register) is currently visible.
   * Can be 'login' or 'register'.
   * @type {['login', 'register'][number]}
   */
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const { login } = useAuth(); // Use login from our Next.js AuthContext

  // This 'login' function from useAuth now expects accessToken and optionally refreshToken
  // The LoginForm will need to be adapted to call this correctly after a successful API login.
  /**
   * @function handleLoginSuccess
   * @description Callback function invoked when the `LoginForm` component reports a successful login.
   * It calls the `login` method from `AuthContext` to update the application's authentication state.
   * @param {string} accessToken - The access token received upon successful login.
   * @param {string} [refreshToken] - The optional refresh token received upon successful login.
   */
  const handleLoginSuccess = (accessToken: string, refreshToken?: string) => {
    login(accessToken, refreshToken); // Update auth state using context's login
    // Navigation is handled by AuthContext's login method or HomePage's useEffect
  };

  /**
   * @function handleRegisterSuccess
   * @description Callback function invoked when the `RegisterForm` component reports a successful registration.
   * It switches the active tab to 'login', prompting the user to sign in with their new credentials.
   * An optional email parameter (currently commented out) could be used to pre-fill the login form.
   */
  const handleRegisterSuccess = (/* email?: string */) => { // email param might be useful for pre-filling login
    setActiveTab('login');
    // Optionally, if LoginForm can accept an initial email:
    // setInitialEmailForLogin(email); 
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-xl rounded-xl w-full max-w-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-4 px-6 text-center font-semibold text-base transition-colors focus:outline-none
              ${activeTab === 'login' ? 'text-gray-800 bg-white border-b-2 border-brand-lime' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('login')}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-4 px-6 text-center font-semibold text-base transition-colors focus:outline-none
              ${activeTab === 'register' ? 'text-gray-800 bg-white border-b-2 border-brand-lime' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('register')}
          >
            Create Account
          </button>
        </div>

        <div className="p-8 sm:p-10">
          {activeTab === 'login' && (
            <LoginForm 
              onSuccess={handleLoginSuccess} 
              switchToRegister={() => setActiveTab('register')} 
            />
          )}
          {activeTab === 'register' && (
            <RegisterForm 
              onSuccess={handleRegisterSuccess} 
              switchToLogin={() => setActiveTab('login')} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
