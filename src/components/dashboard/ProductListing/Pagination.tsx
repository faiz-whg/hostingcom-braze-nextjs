/**
 * @file Pagination.tsx
 * @description A client component that provides pagination controls for lists or tables.
 * It allows users to navigate through pages, and select the number of items displayed per page.
 */
'use client';

import React from 'react';

/**
 * @interface PageButtonProps
 * @description Defines the props for the internal PageButton component.
 */
interface PageButtonProps {
  /** @property children - The content to display inside the button (e.g., page number or icon). */
  children: React.ReactNode;
  /** @property {boolean} [isDisabled] - If true, the button is disabled and non-interactive. */
  isDisabled?: boolean;
  /** @property {boolean} [isCurrent] - If true, styles the button as the current page. */
  isCurrent?: boolean;
  /** @property {() => void} [onClick] - Callback function executed when the button is clicked. */
  onClick?: () => void;
  /** @property ariaLabel - Accessible label for the button. */
  ariaLabel: string;
}

/**
 * @component PageButton
 * @description Renders a single, styled button for pagination controls (e.g., page number, next, previous).
 * @param {PageButtonProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered page button.
 */
const PageButton: React.FC<PageButtonProps> = ({ children, isDisabled, isCurrent, onClick, ariaLabel }) => (
  <button
    type="button"
    disabled={isDisabled}
    onClick={onClick}
    aria-label={ariaLabel}
    aria-current={isCurrent ? 'page' : undefined}
    className={`w-8 h-8 border border-brand-gray-dark bg-white rounded-md 
                cursor-pointer flex items-center justify-center transition-all duration-200 
                text-brand-gray-textMedium text-base
                ${isCurrent ? 'bg-brand-lime border-brand-lime text-brand-green font-semibold' : ''}
                ${!isDisabled && !isCurrent ? 'hover:bg-gray-100 hover:border-gray-400' : ''}
                ${isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
  >
    {children}
  </button>
);

/**
 * @interface PaginationProps
 * @description Defines the props for the main Pagination component.
 */
interface PaginationProps {
  /** @property currentPage - The currently active page number. */
  currentPage: number;
  /** @property totalPages - The total number of pages available. */
  totalPages: number;
  /** @property itemsPerPage - The number of items currently displayed per page. */
  itemsPerPage: number;
  /** @property totalItems - The total number of items across all pages. */
  totalItems: number;
  /** @property onPageChange - Callback function executed when the page changes, passing the new page number. */
  onPageChange: (page: number) => void;
  /** @property onItemsPerPageChange - Callback function executed when the number of items per page changes, passing the new count. */
  onItemsPerPageChange: (count: number) => void;
}

/**
 * @component Pagination
 * @description Renders the complete pagination control section.
 * Includes a dropdown for items per page, information about the current view (e.g., "Showing 1-10 of 100"),
 * and navigation buttons (first, previous, page numbers, next, last).
 * @param {PaginationProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered pagination controls.
 */
const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  itemsPerPage, 
  totalItems, 
  onPageChange, 
  onItemsPerPageChange 
}) => {
  /**
   * @function handleItemsPerPageChange
   * @description Handles the change event from the 'items per page' select dropdown.
   * @param {React.ChangeEvent<HTMLSelectElement>} event - The select change event.
   */
  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onItemsPerPageChange(Number(event.target.value));
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Basic logic for page numbers - can be expanded for more complex scenarios (e.g., ellipsis)
  const pageNumbers: (number | string)[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    pageNumbers.push(1);
    if (currentPage > 3) {
      pageNumbers.push('...');
    }
    if (currentPage > 2) pageNumbers.push(currentPage - 1);
    if (currentPage !== 1 && currentPage !== totalPages) pageNumbers.push(currentPage);
    if (currentPage < totalPages - 1) pageNumbers.push(currentPage + 1);
    if (currentPage < totalPages - 2) {
      pageNumbers.push('...');
    }
    pageNumbers.push(totalPages);
     // Deduplicate and clean up ellipsis logic
    const uniquePageNumbers: (number | string)[] = [];
    let lastPushed: (number | string) | null = null;
    for (const p of pageNumbers) {
        if (p === '...' && lastPushed === '...') continue;
        uniquePageNumbers.push(p);
        lastPushed = p;
    }
    // Ensure first and last are not '...' if only 1 or 2 pages away from actual start/end
    if (uniquePageNumbers[1] === '...' && uniquePageNumbers[0] === 1 && (uniquePageNumbers[2] === 2 || uniquePageNumbers[2] === 3) ) {
        uniquePageNumbers.splice(1,1); // remove '...' after 1 if next is 2 or 3
    }
    if (uniquePageNumbers[uniquePageNumbers.length - 2] === '...' && uniquePageNumbers[uniquePageNumbers.length - 1] === totalPages && (uniquePageNumbers[uniquePageNumbers.length - 3] === totalPages -1 || uniquePageNumbers[uniquePageNumbers.length - 3] === totalPages - 2) ){
        uniquePageNumbers.splice(uniquePageNumbers.length - 2, 1); // remove '...' before last if prev is N-1 or N-2
    }
    pageNumbers.splice(0, pageNumbers.length, ...uniquePageNumbers.filter((v,i,a)=>a.indexOf(v)===i || typeof v === 'number'));
  }

  return (
    <div className="px-6 py-5 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between text-sm text-brand-gray-textLight gap-4 md:gap-0">
      <div className="flex items-center gap-2">
        <label htmlFor="rowsPerPage" className="sr-only md:not-sr-only">Rows per page</label>
        <select 
          id="rowsPerPage" 
          value={itemsPerPage} 
          onChange={handleItemsPerPageChange} 
          aria-label="Select number of rows per page"
          className="px-3 py-2 pr-8 border border-brand-gray-dark rounded-md bg-white cursor-pointer focus:outline-none focus:border-brand-lime focus:ring-1 focus:ring-brand-lime">
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
      <div className="page-info text-center md:text-left" aria-live="polite">
        Showing {startItem}-{endItem} of {totalItems}
      </div>
      <div className="flex items-center gap-1.5">
        <PageButton onClick={() => onPageChange(1)} isDisabled={currentPage === 1} ariaLabel="Go to first page">«</PageButton>
        <PageButton onClick={() => onPageChange(currentPage - 1)} isDisabled={currentPage === 1} ariaLabel="Go to previous page">‹</PageButton>
        
        {pageNumbers.map((num, index) => 
          typeof num === 'number' ? (
            <PageButton 
              key={`page-${num}`}
              isCurrent={currentPage === num}
              onClick={() => onPageChange(num)}
              ariaLabel={`Go to page ${num}`}
            >
              {num}
            </PageButton>
          ) : (
            <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center text-brand-gray-textMedium">{num}</span>
          )
        )}

        <PageButton onClick={() => onPageChange(currentPage + 1)} isDisabled={currentPage === totalPages || totalPages === 0} ariaLabel="Go to next page">›</PageButton>
        <PageButton onClick={() => onPageChange(totalPages)} isDisabled={currentPage === totalPages || totalPages === 0} ariaLabel="Go to last page">»</PageButton>
      </div>
    </div>
  );
};

export default Pagination;
