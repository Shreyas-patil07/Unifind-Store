import React, { useState, useCallback, useMemo } from 'react';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/SkeletonLoader';
import { categories } from '../data/categories';
import { useProducts, useProductsBatch } from '../hooks/useProducts';
import { SlidersHorizontal, X, ChevronDown, Search, ArrowUpDown, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getRecentlyViewedIds, addToRecentlyViewed, clearRecentlyViewed } from '../utils/recentlyViewed';

const BuyerPage = () => {
  const { darkMode } = useTheme();
  
  // State - Clean and minimal
  const [filters, setFilters] = useState({
    category: 'All',
    condition: 'all',
  });
  const [sort, setSort] = useState('newest');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  
  // UI State
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  
  // Recently viewed IDs
  const [recentlyViewedIds, setRecentlyViewedIds] = useState(() => getRecentlyViewedIds());
  
  // Build API query params - Backend handles everything
  const queryParams = useMemo(() => {
    const params = {
      sort,
      page: 1,
      page_size: 100, // Fetch more items at once
    };
    
    if (appliedSearch) params.q = appliedSearch;
    if (filters.category !== 'All') params.category = filters.category;
    if (filters.condition !== 'all') params.condition = filters.condition;
    
    return params;
  }, [appliedSearch, filters, sort]);
  
  // Fetch products - Backend does ALL filtering/sorting
  const { data: productsResponse, isLoading: loading } = useProducts(queryParams);
  const products = productsResponse?.items || [];
  const total = productsResponse?.total || 0;
  
  // Fetch recently viewed products in ONE batch request
  const { data: recentlyViewedProducts = [] } = useProductsBatch(recentlyViewedIds.slice(0, 6));
  
  // Handle search submission
  const handleSearch = useCallback(() => {
    setAppliedSearch(searchInput);
  }, [searchInput]);
  
  // Handle product view
  const handleProductView = useCallback((product) => {
    addToRecentlyViewed(product);
    setRecentlyViewedIds(getRecentlyViewedIds());
  }, []);
  
  // Clear recently viewed
  const handleClearRecentlyViewed = useCallback(() => {
    clearRecentlyViewed();
    setRecentlyViewedIds([]);
  }, []);
  
  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({ category: 'All', condition: 'all' });
    setSort('newest');
    setSearchInput('');
    setAppliedSearch('');
  }, []);
  
  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'All') count++;
    if (filters.condition !== 'all') count++;
    return count;
  }, [filters]);
  
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'most-viewed', label: 'Most Viewed' }
  ];
  
  const FilterChip = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-indigo-600 text-white shadow-glow-indigo'
          : darkMode 
            ? 'bg-[#212121] text-neutral-300 border border-neutral-700 hover:border-indigo-500 hover:text-indigo-400'
            : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className={`min-h-[100dvh] pb-[calc(64px+env(safe-area-inset-bottom))] ${darkMode ? 'bg-[#0f0f0f]' : 'bg-slate-50'}`}>
      <Header />

      {/* Sticky Search Bar */}
      <div className={`sticky top-16 sm:top-[72px] z-40 ${darkMode ? 'bg-[#0f0f0f]' : 'bg-slate-50'}`}>
        <div className="px-3 sm:px-6 md:px-10 lg:px-20 pt-3 pb-3">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm font-medium border transition-all duration-200 ${
                darkMode 
                  ? 'bg-[#212121] border-neutral-700 text-neutral-200 placeholder-neutral-500 focus:border-indigo-500'
                  : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-indigo-400'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setAppliedSearch('');
                }}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 sm:p-1.5 rounded-lg transition-all active:scale-95 ${
                  darkMode ? 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-6 md:px-10 lg:px-20 with-bottom-nav">

        {/* Recently Viewed */}
        {recentlyViewedProducts.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-sm font-bold ${darkMode ? 'text-neutral-100' : 'text-slate-900'}`}>
                Recently Viewed
              </h2>
              <button
                onClick={handleClearRecentlyViewed}
                className={`flex items-center gap-1 text-xs font-medium ${darkMode ? 'text-slate-400 hover:text-red-400' : 'text-slate-500 hover:text-red-600'} transition-colors`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
                {recentlyViewedProducts.map((product) => (
                  <div key={product.id} className="w-40 flex-shrink-0">
                    <ProductCard product={product} onView={handleProductView} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="mb-6">
          <div className="flex items-center gap-3 pb-2 relative">
            <div className="flex items-center gap-3 overflow-x-auto flex-1">
              {/* Filters Button */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setFilterDrawerOpen(true)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors shadow-sm ${
                    darkMode 
                      ? 'bg-[#212121] border-neutral-700 text-neutral-300 hover:border-indigo-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                  } ${activeFiltersCount > 0 ? 'ring-2 ring-indigo-500/50 border-indigo-500' : ''}`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Reset Button */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors shadow-sm flex-shrink-0 ${
                    darkMode 
                      ? 'bg-[#212121] border-neutral-700 text-neutral-300 hover:border-red-500 hover:text-red-400'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-red-300 hover:text-red-600'
                  }`}
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex-shrink-0 ml-auto">
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors shadow-sm ${
                  darkMode 
                    ? 'bg-[#212121] border-neutral-700 text-neutral-300 hover:border-indigo-500'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                }`}
              >
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">{sortOptions.find(opt => opt.value === sort)?.label || 'Sort'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${sortDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {sortDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-[60]" 
                    onClick={() => setSortDropdownOpen(false)}
                  />
                  <div className={`absolute top-full right-0 mt-2 rounded-xl border shadow-xl z-[61] min-w-[200px] ${
                    darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'
                  }`}>
                    {sortOptions.map((option, index) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSort(option.value);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                          sort === option.value
                            ? darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
                            : darkMode ? 'text-neutral-300 hover:bg-neutral-800' : 'text-slate-700 hover:bg-slate-50'
                        } ${index === 0 ? 'rounded-t-xl' : ''} ${index === sortOptions.length - 1 ? 'rounded-b-xl' : ''}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4">
            <p className={`text-sm ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
              <span className={`font-bold ${darkMode ? 'text-neutral-200' : 'text-slate-900'}`}>{total}</span> results
              {filters.category !== 'All' && (
                <span className="ml-1">in <span className="font-semibold text-indigo-600">{filters.category}</span></span>
              )}
            </p>
          </div>
        </div>

        {/* Filter Drawer */}
        {filterDrawerOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] animate-fade-in"
              onClick={() => setFilterDrawerOpen(false)}
            />
            <div className={`fixed bottom-0 left-0 right-0 z-[61] rounded-t-3xl p-6 shadow-2xl animate-slide-in-up max-h-[80vh] overflow-y-auto ${darkMode ? 'bg-[#212121] border-t-2 border-neutral-700' : 'bg-white border-t-2 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Filters</h3>
                <button 
                  onClick={() => setFilterDrawerOpen(false)} 
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-slate-100 text-slate-600'}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Category */}
              <div className="mb-6">
                <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>Category</h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <FilterChip
                      key={cat}
                      label={cat}
                      active={filters.category === cat}
                      onClick={() => setFilters(prev => ({ ...prev, category: cat }))}
                    />
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div className="mb-6">
                <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>Condition</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'All Conditions', val: 'all' },
                    { label: 'Like New', val: 'Like New' },
                    { label: 'Excellent', val: 'Excellent' },
                    { label: 'Good', val: 'Good' },
                    { label: 'Fair', val: 'Fair' },
                  ].map(({ label, val }) => (
                    <FilterChip
                      key={val}
                      label={label}
                      active={filters.condition === val}
                      onClick={() => setFilters(prev => ({ ...prev, condition: val }))}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    resetFilters();
                    setFilterDrawerOpen(false);
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors ${
                    darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Reset
                </button>
                <button
                  onClick={() => setFilterDrawerOpen(false)}
                  className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          ) : (
            products.map((product) => (
              <ProductCard key={product.id} product={product} onView={handleProductView} />
            ))
          )}
        </div>

        {/* Empty state */}
        {products.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className={`text-lg font-semibold mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>
              No products found
            </p>
            <p className={`text-sm mb-6 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Try adjusting your filters</p>
            <button onClick={resetFilters} className="btn-gradient px-6 py-2.5 text-sm">
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerPage;
