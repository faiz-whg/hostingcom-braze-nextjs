/**
 * @file ProductListingSection.tsx
 * @description A client component that orchestrates the display of a product listing feature.
 * It integrates tabs, a filter bar, a product table, and pagination to allow users to browse products.
 * Note: Currently uses mock data for products and tabs.
 */
import React, { useState, useEffect } from 'react';
import FilterBar from './FilterBar';
import Tabs, { type TabDefinition } from './Tabs';
import ProductTable, { type Product } from './ProductTable';
import Pagination from './Pagination';

/**
 * @constant productTabs
 * @description Sample tab definitions for product categories. Used for initializing tabs.
 * In a real application, this might come from a configuration or API.
 * Each object conforms to the {@link TabDefinition} type.
 */
const productTabs: TabDefinition[] = [
  { id: 'all', label: 'All Products' }, 
  { id: 'hosting', label: 'Web Hosting' },
  { id: 'domains', label: 'Domains' },
  { id: 'email', label: 'Email Services' },
];

/**
 * @constant allMockProducts
 * @description Mock array of product data for demonstration purposes.
 * Replace with actual data fetching logic in a production environment.
 * Each object conforms to the {@link Product} type.
 */
const allMockProducts: Product[] = Array.from({ length: 3 }, (_, i) => ({
  id: `prod-${i + 1}`,
  mainTitle: i % 3 === 0 ? 'Shared Hosting' : (i % 3 === 1 ? 'Domain Registration' : 'Business Email'),
  name: `Product Alpha ${i + 1}`,
  domain: `example${i+1}.com`,
  domainIcon: `${(i+1).toString().padStart(2,'0')}`,
  dueDate: `2024-12-${(i % 28) + 1}`,
  status: i % 4 === 0 ? 'Active' : (i % 4 === 1 ? 'Expires Soon' : (i % 4 === 2 ? 'Suspended' : 'Pending')),
  statusType: i % 4 === 0 ? 'active' : (i % 4 === 1 ? 'warning' : (i % 4 === 2 ? 'error' : 'info')),
  actions: ['Manage', 'Renew'],
  category: productTabs[(i % productTabs.length)].id, // Assign a category for filtering
}));

/**
 * @component ProductListingSection
 * @description Orchestrates the product listing interface, including tabs for categories,
 * a filter bar, a table displaying products, and pagination controls.
 * Manages state for active tab, filtered product list, current page, items per page, and loading status.
 * @returns {React.ReactElement} The rendered product listing section.
 */
const ProductListingSection: React.FC = () => {
  /** @state activeTabId - The ID of the currently active product category tab. */
  const [activeTabId, setActiveTabId] = useState<string>(productTabs[0]?.id || 'all');
  /** @state filteredProducts - An array of products filtered by the active tab/category. */
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(allMockProducts);
  /** @state currentPage - The current page number in the paginated product list. */
  const [currentPage, setCurrentPage] = useState<number>(1);
  /** @state itemsPerPage - The number of products to display per page. */
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  /** @state isLoading - Boolean flag to indicate if product data is being loaded/filtered (for future async operations). */
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Dynamically create tabs with counts based on all mock products.
  // In a real scenario, counts might come from an API or be calculated after actual data fetching.
  const TABS_WITH_COUNTS: TabDefinition[] = productTabs.map(tab => ({
    ...tab,
    count: allMockProducts.filter(p => tab.id === 'all' || p.category === tab.id).length,
  }));

  /**
   * @effect Effect to filter products when the active tab changes.
   * Simulates an asynchronous data fetching/filtering operation.
   * Resets to the first page upon tab change.
   */
  useEffect(() => {
    // Simulate fetching/filtering products based on activeTabId
    setIsLoading(true);
    const timer = setTimeout(() => {
      if (activeTabId === 'all') {
        setFilteredProducts(allMockProducts);
      } else {
        setFilteredProducts(allMockProducts.filter(p => p.category === activeTabId));
      }
      setCurrentPage(1); // Reset to first page on tab change
      setIsLoading(false);
    }, 300); // Simulate network delay
    return () => clearTimeout(timer);
  }, [activeTabId]);

  /**
   * @function handleTabChange
   * @description Callback function to update the active tab when a tab is clicked.
   * @param {string} tabId - The ID of the newly selected tab.
   */
  const handleTabChange = (tabId: string) => {
    setActiveTabId(tabId);
  };

  /**
   * @function handlePageChange
   * @description Callback function to update the current page number for pagination.
   * @param {number} page - The new page number.
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  /**
   * @function handleItemsPerPageChange
   * @description Callback function to update the number of items displayed per page.
   * Resets to the first page when items per page changes.
   * @param {number} count - The new number of items per page.
   */
  const handleItemsPerPageChange = (count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <section className="bg-white rounded-xl shadow-feature-card mb-10 overflow-hidden">
      <FilterBar /> {/* FilterBar might also need to interact with product data/filtering logic */}
      <Tabs 
        tabs={TABS_WITH_COUNTS}
        activeTabId={activeTabId}
        onTabChange={handleTabChange}
        ariaLabel="Product Categories"
      />
      <ProductTable products={currentProducts} isLoading={isLoading} />
      {totalItems > 0 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </section>
  );
};

export default ProductListingSection;
