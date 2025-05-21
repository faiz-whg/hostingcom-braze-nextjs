/**
 * @file Tabs.tsx
 * @description A client component that renders a tab-based navigation interface.
 * It allows users to switch between different content sections or categories.
 */
'use client';

import React from 'react';

/**
 * @export
 * @interface TabDefinition
 * @description Defines the structure for a single tab's configuration.
 */
export interface TabDefinition {
  /** @property id - A unique identifier for the tab. */
  id: string;
  /** @property label - The display text for the tab. */
  label: string;
  /** @property {number} [count] - Optional. A numerical badge to display next to the tab label (e.g., item count). */
  count?: number;
  /** @property {string} [ariaControls] - Optional. The ID of the tab panel element that this tab controls, for accessibility. */
  ariaControls?: string;
}

/**
 * @interface TabItemProps
 * @description Props for the internal TabItem component.
 */
interface TabItemProps {
  label: string;
  /** @property isActive - Boolean indicating if the tab item is currently active. */
  isActive: boolean;
  /** @property onClick - Callback function to be executed when the tab item is clicked. */
  onClick: () => void;
  /** @property {string} [ariaControls] - The ID of the tab panel element controlled by this tab item. */
  ariaControls?: string;
  /** @property {number} [count] - Optional numerical badge to display. */
  count?: number;
}

/**
 * @component TabItem
 * @description Renders a single, clickable tab item within the tab list.
 * Displays a label and an optional count badge. Manages active state styling.
 * @param {TabItemProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered tab item button.
 */
const TabItem: React.FC<TabItemProps> = ({ label, isActive, onClick, ariaControls, count }) => (
  <button
    type="button"
    role="tab"
    aria-selected={isActive}
    aria-controls={ariaControls}
    onClick={onClick}
    className={`px-4 sm:px-5 py-3.5 sm:py-4 cursor-pointer border-b-[3px] transition-all duration-200 
                text-sm sm:text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-brand-lime focus:ring-opacity-50
                flex items-center gap-2
                ${isActive 
                  ? 'text-brand-gray-text border-brand-lime'
                  : 'text-brand-gray-textLight border-transparent hover:bg-brand-gray-light hover:text-brand-gray-text'}`}
  >
    {label}
    {typeof count !== 'undefined' && (
      <span 
        className={`text-xs px-1.5 py-0.5 rounded-full transition-colors duration-200
                    ${isActive ? 'bg-brand-lime text-brand-green font-semibold' : 'bg-brand-gray-light text-brand-gray-textMedium group-hover:bg-gray-300'}`}
      >
        {count}
      </span>
    )}
  </button>
);

/**
 * @interface TabsProps
 * @description Props for the main Tabs component.
 */
interface TabsProps {
  /** @property tabs - An array of {@link TabDefinition} objects defining the tabs to be rendered. */
  tabs: TabDefinition[];
  /** @property activeTabId - The ID of the currently active tab. */
  activeTabId: string;
  /** @property onTabChange - Callback function executed when a tab is clicked, passing the ID of the selected tab. */
  onTabChange: (tabId: string) => void;
  /** @property {string} [ariaLabel] - Optional. An accessible label for the `tablist` container. Defaults to 'Content tabs'. */
  ariaLabel?: string;
}

/**
 * @component Tabs
 * @description Renders a list of clickable tabs based on the provided `tabs` data.
 * Manages the active state of tabs and handles tab change events.
 * @param {TabsProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered tab list container.
 */
const Tabs: React.FC<TabsProps> = ({ tabs, activeTabId, onTabChange, ariaLabel }) => {
  return (
    <div className="border-b border-brand-gray-dark">
      <div role="tablist" aria-label={ariaLabel || 'Content tabs'} className="flex px-1 sm:px-2">
        {tabs.map(tab => (
          <TabItem 
            key={tab.id}
            label={tab.label}
            isActive={activeTabId === tab.id}
            onClick={() => onTabChange(tab.id)}
            ariaControls={tab.ariaControls}
            count={tab.count}
          />
        ))}
      </div>
    </div>
  );
};

export default Tabs;
