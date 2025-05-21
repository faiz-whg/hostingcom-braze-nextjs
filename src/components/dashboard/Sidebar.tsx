/**
 * @file Sidebar.tsx
 * @description Client component for the main application sidebar navigation.
 * Provides links to different sections of the application, handles active state based on route,
 * and includes responsive behavior for mobile view.
 */
'use client';

import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrazeService from '@/lib/services/braze';

// --- SVG Icon Components ---
/** @component HomeIcon - SVG icon for 'Home' navigation. */
const HomeIcon: React.FC = () => <svg className="w-5 h-5" fill="none" strokeWidth="2" viewBox="0 0 20 20"><path d="M3 9l7-7 7 7v9a1 1 0 0 1-1 1h-4v-5h-4v5H4a1 1 0 0 1-1-1V9z" strokeLinejoin="round" strokeLinecap="round"/></svg>;
/** @component ProductsIcon - SVG icon for 'Products' navigation. */
const ProductsIcon: React.FC = () => <svg className="w-5 h-5" fill="none" strokeWidth="2" viewBox="0 0 20 20"><rect x="2" y="6" width="16" height="12" rx="1" /><path d="M6 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinejoin="round" strokeLinecap="round"/></svg>;
/** @component BillingIcon - SVG icon for 'Billing' navigation. */
const BillingIcon: React.FC = () => <svg className="w-5 h-5" fill="none" strokeWidth="2" viewBox="0 0 20 20"><rect x="2" y="5" width="16" height="10" rx="2" /><path d="M6 10h8" strokeLinejoin="round" strokeLinecap="round"/></svg>;
/** @component PlusIcon - SVG icon for 'Add' or 'New Order' actions. */
const PlusIcon: React.FC = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20"><path d="M10 5v10m-5-5h10" strokeLinejoin="round" strokeLinecap="round"/></svg>;
/** @component CogIcon - SVG icon for 'Settings' or 'Preferences'. */
const CogIcon: React.FC = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>;
/** @component LogoutIcon - SVG icon for 'Logout'. */
const LogoutIcon: React.FC = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>;
// --- End SVG Icon Components ---

/**
 * @interface NavItemProps
 * @description Props for the NavItem component, representing a single item in the sidebar navigation.
 */
interface NavItemProps {
  /** @property icon - The SVG icon element to display for the navigation item. */
  icon: React.ReactElement;
  /** @property text - The display text for the navigation item. */
  text: string;
  /** @property isActive - Boolean indicating if the navigation item is currently active/selected. */
  isActive: boolean;
  /** @property [hasArrow] - Optional boolean to display a right-arrow, typically for items with sub-menus or future expansion. */
  hasArrow?: boolean;
  /** @property [onClick] - Optional callback function to execute when the item is clicked. */
  onClick?: () => void;
  /** @property [href] - Optional URL path for the navigation link. If provided, the item renders as a Next.js <Link>. */
  href?: string;
}

/**
 * @component NavItem
 * @description Renders a single navigation item within the sidebar.
 * Can be a link (if `href` is provided) or a clickable div (if only `onClick` is provided).
 * @param {NavItemProps} props - The props for the navigation item.
 * @returns {React.ReactElement} The rendered navigation item.
 */
const NavItem: React.FC<NavItemProps> = ({ icon, text, isActive, hasArrow, onClick, href }) => {
  const content = (
    <>
      <span className={`transition-colors group-hover:stroke-brand-green ${isActive ? 'stroke-brand-green' : 'stroke-current'}`}>
        {icon}
      </span>
      <span className="flex-1 text-[15px]">{text}</span>
      {hasArrow && <span className={`text-gray-400 text-xl transition-transform duration-200 ${isActive ? 'transform translate-x-0.5' : 'group-hover:translate-x-0.5'}`}>›</span>}
    </>
  );

  const itemClasses = `group flex items-center gap-3 px-4 py-2.5 cursor-pointer rounded-lg transition-all duration-200 mb-1
    ${isActive 
      ? 'bg-brand-gray text-brand-green transform translate-x-1 font-medium' 
      : 'text-brand-gray-textLight hover:bg-brand-gray-light hover:text-brand-gray-text hover:translate-x-1'}`;

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={itemClasses}>
        {content}
      </Link>
    );
  }
  return (
    <div onClick={onClick} className={itemClasses} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onClick?.()}>
      {content}
    </div>
  );
};

/**
 * @interface SidebarProps
 * @description Props for the Sidebar component.
 */
interface SidebarProps {
  /** @property isMobileOpen - Boolean indicating if the sidebar is currently open in mobile view. */
  isMobileOpen: boolean;
  /** @property toggleMobileSidebar - Callback function to toggle the visibility of the sidebar in mobile view. */
  toggleMobileSidebar: () => void;
  /** @property onLogout - Callback function to execute when the logout item is clicked. */
  onLogout: () => void;
}

/**
 * @interface NavItemData
 * @description Extends NavItemProps to include an `id` for keying and an optional `action` for non-link items.
 * Used for defining the structure of navigation items data arrays.
 */
interface NavItemData extends NavItemProps {
  /** @property id - A unique string identifier for the navigation item, used for React keys. */
  id: string;
  /** @property [action] - Optional callback function for items that perform an action rather than navigating (e.g., Logout). */
  action?: () => void;
}

/**
 * @component Sidebar
 * @description The main sidebar navigation component for the application.
 * It manages the display of navigation links, handles active states, and provides responsive behavior for mobile.
 * @param {SidebarProps} props - The props for the Sidebar component.
 * @returns {React.ReactElement} The rendered sidebar element.
 */
const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, toggleMobileSidebar, onLogout }) => {
  const [placeOrderButtonState, setPlaceOrderButtonState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [placeOrderButtonText, setPlaceOrderButtonText] = useState('Place new order');

  useEffect(() => {
    let successTimer: NodeJS.Timeout;
    if (placeOrderButtonState === 'loading') {
      setPlaceOrderButtonText('Placing Order...');
    } else if (placeOrderButtonState === 'success') {
      setPlaceOrderButtonText('Order Placed ✓');
      successTimer = setTimeout(() => {
        setPlaceOrderButtonState('idle');
        setPlaceOrderButtonText('Place new order');
      }, 2500); // Revert after 2.5 seconds
    } else { // idle
      setPlaceOrderButtonText('Place new order');
    }
    return () => clearTimeout(successTimer);
  }, [placeOrderButtonState]);

  const pathname = usePathname(); // Hook to get the current URL path.

  // Determine the active navigation item based on the current pathname.
  let activeItem = 'Home'; // Default active item.
  if (pathname?.startsWith('/products')) activeItem = 'Products';
  else if (pathname?.startsWith('/billing')) activeItem = 'Billing';
  else if (pathname?.startsWith('/notification-preferences')) activeItem = 'Notification Preferences';
  else if (pathname === '/dashboard') activeItem = 'Home';

  const mainNavItems: NavItemData[] = [
    { id: 'Home', icon: <HomeIcon />, text: 'Home', href: '/dashboard', isActive: activeItem === 'Home' },
    { id: 'Products', icon: <ProductsIcon />, text: 'Products', hasArrow: true, href: '#', isActive: activeItem === 'Products' }, // TODO: Replace # with actual path
    { id: 'Billing', icon: <BillingIcon />, text: 'Billing', hasArrow: true, href: '#', isActive: activeItem === 'Billing' }, // TODO: Replace # with actual path
  ];

  const utilityNavItems: NavItemData[] = [
    { id: 'Notification Preferences', icon: <CogIcon />, text: 'Preferences', href: '/notification-preferences', isActive: activeItem === 'Notification Preferences' },
    { id: 'Logout', icon: <LogoutIcon />, text: 'Logout', action: onLogout, isActive: activeItem === 'Logout' }, // No href, action will be called
  ];

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={toggleMobileSidebar}
          role="button"
          tabIndex={-1}
          aria-label="Close sidebar overlay"
          onKeyDown={(e) => e.key === 'Enter' && toggleMobileSidebar()}
        ></div>
      )}
      <aside 
        className={`fixed md:sticky md:top-[60px] left-0 h-[calc(100vh-60px)] 
                   w-64 sm:w-72 bg-white border-r border-brand-gray-dark p-5 z-20
                   transform transition-transform duration-300 ease-in-out md:translate-x-0
                   ${isMobileOpen ? 'translate-x-0 shadow-xl top-[60px]' : '-translate-x-full top-[60px] md:top-[60px]'}
                   flex flex-col`}
      >
        <div> {/* Top section for button and main nav */}
          <button 
            className={`w-full font-semibold px-5 py-3.5 rounded-lg flex items-center justify-center gap-2 text-base mb-6 
                       transition-all duration-300 ease-in-out 
                       ${placeOrderButtonState === 'success' 
                         ? 'bg-green-500 text-white shadow-md'
                         : placeOrderButtonState === 'loading' 
                           ? 'bg-gray-300 text-gray-500 shadow-inner cursor-not-allowed'
                           : 'bg-[linear-gradient(135deg,#46fdae,#c6fb4b)] text-brand-green shadow-btn-new-order hover:opacity-90 hover:-translate-y-0.5 hover:shadow-btn-new-order-hover'}
                       active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#46fdae] focus:ring-opacity-50`}
            onClick={async () => {
              if (placeOrderButtonState === 'loading' || placeOrderButtonState === 'success') return; // Prevent multiple clicks

              // If mobile and open, toggle immediately at the start of the action.
              if (isMobileOpen) {
                toggleMobileSidebar();
              }

              setPlaceOrderButtonState('loading');
              // Simulate API call for placing order
              await new Promise(resolve => setTimeout(resolve, 2000)); 

              if (BrazeService.isInitialized) {
                const eventProperties = {
                  source_component: 'Sidebar',
                  order_status: 'success_simulated',
                  // Potentially add orderId if one were generated, e.g., orderId: `sim-${Date.now()}`
                };
                BrazeService.logCustomEvent('Order Placed', eventProperties); // Changed event name
                console.log('Sidebar: Logged Braze event "Order Placed"', eventProperties);
              }
              setPlaceOrderButtonState('success');
              // Mobile sidebar is already handled if it was open.
            }}
            disabled={placeOrderButtonState === 'loading' || placeOrderButtonState === 'success'}
          >
            <PlusIcon />
            <span>{placeOrderButtonText}</span>
          </button>
          <nav>
            {mainNavItems.map(item => (
              <NavItem 
                key={item.id}
                icon={item.icon}
                text={item.text} 
                isActive={item.isActive} 
                hasArrow={item.hasArrow}
                href={item.href}
                onClick={() => { if(isMobileOpen) toggleMobileSidebar(); }}
              />
            ))}
          </nav>
        </div>

        <nav className="mt-auto pt-4 border-t border-gray-200"> {/* Bottom utility nav */}
          {utilityNavItems.map(item => (
            <NavItem 
              key={item.id}
              icon={item.icon} 
              text={item.text} 
              isActive={item.isActive}
              href={item.href}
              onClick={() => {
                if (item.action) item.action();
                if(isMobileOpen) toggleMobileSidebar();
              }}
            />
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
