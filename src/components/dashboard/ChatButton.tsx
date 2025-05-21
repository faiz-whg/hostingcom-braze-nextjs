/**
 * @file ChatButton.tsx
 * @description A client component that renders a fixed-position button for initiating a chat session.
 */
'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

/**
 * @component ChatButton
 * @description Renders a floating action button typically used to open a chat interface.
 * It is fixed to the bottom-right of the screen and includes an icon and text.
 * The button has hover and focus effects for better user experience.
 * @returns {React.ReactElement} The rendered chat button element.
 */
const ChatButton: React.FC = () => {
  return (
    <button 
      className="fixed bottom-6 right-6 bg-brand-green text-white px-6 py-4 rounded-4xl 
                 border-none cursor-pointer flex items-center gap-2 text-base font-medium 
                 shadow-chat-button hover:bg-brand-green-darker hover:-translate-y-0.5 hover:shadow-chat-button-hover 
                 transition-all duration-300 z-20 focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-opacity-50"
      // onClick={() => console.log('Chat button clicked')} // Example onClick
    >
      <MessageCircle className="w-5 h-5" />
      <span>Chat with us</span>
    </button>
  );
};

export default ChatButton;
