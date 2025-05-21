/**
 * @file ProductTable.tsx
 * @description A client component that renders a table display for a list of products.
 * It includes a header, rows for each product, and handles loading and empty states.
 */
'use client';

import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import BrazeService from '@/lib/services/braze';

/**
 * @export
 * @interface Product
 * @description Defines the structure of a product data object.
 */
export interface Product {
  /** @property id - Unique identifier for the product. */
  id: number | string;
  /** @property mainTitle - The main category or type of the product (e.g., 'Shared Hosting'). */
  mainTitle: string;
  /** @property name - The specific name of the product (e.g., 'Product Alpha 1'). */
  name: string;
  /** @property domain - Associated domain name, if applicable. */
  domain: string;
  /** @property domainIcon - A string (e.g., initials or an identifier) for a small visual icon next to the domain. */
  domainIcon: string;
  /** @property dueDate - The next due date for the product/service. */
  dueDate: string;
  /** @property status - The current status of the product (e.g., 'Active', 'Expires Soon'). */
  status: string;
  /** @property {'active' | 'warning' | 'error' | 'info'} [statusType] - Optional. A type hint for styling the status badge dynamically. */
  statusType?: 'active' | 'warning' | 'error' | 'info';
  /** @property actions - An array of strings representing available actions for the product (e.g., 'Manage', 'Renew'). */
  actions: string[];
  /** @property {string} [category] - Optional. The category ID this product belongs to, used for filtering by tabs. */
  category?: string;
}

/**
 * @component StatusWarningIcon
 * @description SVG icon component used to indicate a warning or error status for a product.
 * @param {React.SVGProps<SVGSVGElement>} props - Standard SVG props.
 * @returns {React.ReactElement} The rendered SVG warning icon.
 */
const StatusWarningIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current" {...props}>
    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
  </svg>
);

/**
 * @component TableHeader
 * @description Renders the header row for the product table.
 * Defines column titles for product name, due date, status, and actions.
 * @returns {React.ReactElement} The rendered table header element.
 */
const TableHeader: React.FC = () => (
  <div className="grid grid-cols-[2.5fr_1.5fr_1.5fr_2fr] md:grid-cols-[2.5fr_1.5fr_1.5fr_2fr] lg:grid-cols-[2.5fr_1.5fr_1.5fr_2fr] xl:grid-cols-[2.5fr_1.5fr_1.5fr_2fr] 
                  px-6 py-3 bg-brand-gray-light font-semibold text-[13px] text-brand-gray-textMedium capitalize">
    <div>Product name</div>
    <div className="hidden md:block">Next due date</div>
    <div className="hidden lg:block">Status</div>
    <div className="text-right">Actions</div> {/* Changed from invisible for alignment, actions might be present in header for sorting/filtering */} 
  </div>
);

/**
 * @interface TableRowProps
 * @description Defines the props for the TableRow component.
 */
interface TableRowProps {
  /** @property product - The {@link Product} data object for the row to display. */
  product: Product;
}

/**
 * @component TableRow
 * @description Renders a single row in the product table, displaying details for one product.
 * Includes product name, domain, due date, status, and action buttons.
 * @param {TableRowProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered table row element.
 */
const TableRow: React.FC<TableRowProps> = ({ product }) => {
  const [actionStates, setActionStates] = useState<{[key: string]: string}>({}); 
  // e.g. { Renew: 'Renewing...' } or { 'Login to control panel': 'Logging in...' } or { Manage: 'Processing...' }

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    Object.keys(actionStates).forEach(actionKey => {
      // Check for various success states to revert
      if (actionStates[actionKey].endsWith('✓')) { // 'Renewed ✓', 'Logged In ✓', 'Processed ✓'
        const timer = setTimeout(() => {
          setActionStates(prev => ({ ...prev, [actionKey]: '' })); // Revert to default or remove state
        }, 2500); // Revert after 2.5 seconds
        timers.push(timer);
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [actionStates]);

  // Example of how statusType could be used for dynamic classes
  let statusClasses = 'bg-status-active-bg text-status-active-text'; // default
  if (product.statusType === 'warning') {
    statusClasses = 'bg-status-warning-bg text-status-warning-text'; // Ensure these classes exist
  } else if (product.statusType === 'error') {
    statusClasses = 'bg-status-error-bg text-status-error-text'; // Ensure these classes exist
  }

  return (
    <div className="grid grid-cols-[1fr_auto] md:grid-cols-[2.5fr_1.5fr_2fr] lg:grid-cols-[2.5fr_1.5fr_1.5fr_2fr] 
                    px-6 py-4 border-b border-gray-100 items-center transition-colors duration-200 hover:bg-gray-50 text-sm gap-2.5 md:gap-0">
      {/* Product Info */}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-brand-gray-textLight">{product.mainTitle}</span>
        <span className="font-semibold text-brand-gray-text text-[15px]">{product.name}</span>
        <div className="text-sm text-brand-gray-textLight flex items-center gap-2 mt-1">
          {product.domain}
          <span className="w-4.5 h-4.5 bg-brand-lime text-brand-green rounded-full inline-flex items-center justify-center text-[10px] font-bold leading-none">
            {product.domainIcon}
          </span>
        </div>
      </div>

      {/* Due Date */}
      <div className="hidden md:block text-brand-gray-textMedium text-right md:text-left lg:text-left">{product.dueDate}</div>
      
      {/* Status */}
      <div className="hidden lg:block text-right md:text-left lg:text-left">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-2xl text-xs font-medium ${statusClasses}`}> 
          {/* Conditionally render icon based on status type*/}
          {(product.statusType === 'warning' || product.statusType === 'error' || product.status.toLowerCase().includes('expires soon') || product.status.toLowerCase().includes('issue')) && <StatusWarningIcon />}
          {product.status}
        </span>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-3 items-center justify-start md:justify-end col-span-2 md:col-span-1 lg:col-span-1">
        {product.actions.map(action => {
          let buttonKey = action;
          // The rest of the button logic will be inside this map, returning the button component
          // This is a bit of a hack to ensure the variable 'buttonKey' is declared at the top of the map scope

          buttonKey = action;
          let buttonText = action;
          let buttonAction = async () => {};

          if (action === 'Renew' && product.status === 'Active') {
            buttonKey = 'Login to control panel';
            buttonText = 'Login to control panel';
            buttonAction = async () => {
              if (actionStates[buttonKey] && (actionStates[buttonKey].includes('...') || actionStates[buttonKey].endsWith('✓'))) return;
              setActionStates(prev => ({ ...prev, [buttonKey]: 'Logging in...' }));
              await new Promise(resolve => setTimeout(resolve, 1500));
              if (BrazeService.isInitialized) {
                const eventProperties = {
                  productId: product.id.toString(),
                  productName: product.name,
                  productCategory: product.category || 'N/A',
                  mainTitle: product.mainTitle,
                  domain: product.domain,
                  action_status: 'success_simulated'
                };
                BrazeService.logCustomEvent('Control Panel Logged In', eventProperties);
                console.log('ProductTable: Logged Braze event "Control Panel Logged In"', eventProperties);
              }
              setActionStates(prev => ({ ...prev, [buttonKey]: 'Logged In ✓' }));
            };
          } else if (action === 'Renew') { // For non-active products, keep Renew logic
            buttonKey = 'Renew';
            buttonText = 'Renew';
            buttonAction = async () => {
              if (actionStates[buttonKey] && (actionStates[buttonKey].includes('...') || actionStates[buttonKey].endsWith('✓'))) return;
              setActionStates(prev => ({ ...prev, [buttonKey]: 'Renewing...' }));
              await new Promise(resolve => setTimeout(resolve, 1500));
              if (BrazeService.isInitialized) {
                const eventProperties = {
                  productId: product.id.toString(),
                  productName: product.name,
                  productCategory: product.category || 'N/A',
                  mainTitle: product.mainTitle,
                  domain: product.domain,
                  renewal_status: 'success_simulated'
                };
                BrazeService.logCustomEvent('Product Renewed', eventProperties);
                console.log('ProductTable: Logged Braze event "Product Renewed"', eventProperties);
              }
              setActionStates(prev => ({ ...prev, [buttonKey]: 'Renewed ✓' }));
            };
          } else if (action === 'Manage') {
            buttonKey = 'Manage';
            buttonText = 'Manage';
            buttonAction = async () => {
              if (actionStates[buttonKey] && (actionStates[buttonKey].includes('...') || actionStates[buttonKey].endsWith('✓'))) return;
              setActionStates(prev => ({ ...prev, [buttonKey]: 'Processing...' }));
              await new Promise(resolve => setTimeout(resolve, 1000));
              if (BrazeService.isInitialized) {
                const eventProperties = {
                  productId: product.id.toString(),
                  productName: product.name,
                  productCategory: product.category || 'N/A',
                  mainTitle: product.mainTitle,
                  domain: product.domain,
                  action_status: 'success_simulated'
                };
                BrazeService.logCustomEvent('Managed Product', eventProperties);
                console.log('ProductTable: Logged Braze event "Managed Product"', eventProperties);
              }
              setActionStates(prev => ({ ...prev, [buttonKey]: 'Processed ✓' }));
            };
          }
          // Add other actions as needed

          return (
            <button 
              key={buttonKey + product.id} // Ensure key is unique, especially if action name changes
              type="button"
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md border 
                         cursor-pointer text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap 
                         ${actionStates[buttonKey] && actionStates[buttonKey].endsWith('✓')
                           ? 'bg-green-500 border-green-500 text-white'
                           : actionStates[buttonKey] && actionStates[buttonKey].includes('...')
                             ? 'bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed'
                             : 'border-brand-gray-dark bg-white text-brand-gray-text hover:bg-brand-gray-light hover:border-gray-300 active:bg-brand-gray-dark active:border-brand-gray-dark'}`}
              onClick={buttonAction}
              disabled={!!(actionStates[buttonKey] && (actionStates[buttonKey].includes('...') || actionStates[buttonKey].endsWith('✓')))}
            >
              {actionStates[buttonKey] || buttonText}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * @interface ProductTableProps
 * @description Defines the props for the ProductTable component.
 */
interface ProductTableProps {
  /** @property products - An array of {@link Product} objects to display in the table. */
  products: Product[];
  /** @property {boolean} [isLoading] - Optional. If true, displays a loading message instead of the table. */
  isLoading?: boolean;
}

/**
 * @component ProductTable
 * @description The main component for rendering the list of products in a table format.
 * It displays a header, and then maps over the `products` array to render a {@link TableRow} for each.
 * Handles `isLoading` state to show a loading message and also displays a message if no products are available.
 * @param {ProductTableProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered product table or a loading/empty state message.
 */
const ProductTable: React.FC<ProductTableProps> = ({ products, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-6 text-center text-brand-gray-textMedium">
        Loading products...
        {/* Consider adding a skeleton loader here for better UX */}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="p-6 text-center text-brand-gray-textMedium">
        No products to display.
      </div>
    );
  }

  return (
    <div className="products-table overflow-x-auto">
      <TableHeader />
      {products.map(product => (
        <TableRow key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductTable;
