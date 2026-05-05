import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/LoadingSkeleton';
import { categories } from '../data/categories';
import { getProducts } from '../services/api-service';
import { SlidersHorizontal, X, ChevronDown, Search, ArrowUpDown, Clock, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getRecentlyViewed, addToRecentlyViewed, clearRecentlyViewed } from '../utils/recentlyViewed';

// Memoized filter chip component
const FilterChip = React.memo(({ label, active, onClick, testId, darkMode }) => (
  <button
    onClick={onClick}
    className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-indigo-600 text-white shadow-glow-indigo'
        : darkMode 
          ? 'bg-[#212121] text-neutral-300 border border-neutral-700 hover:border-indigo-500 hover:text-indigo-400'
          : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
    }`}
    data-testid={testId}
  >
    {label}
  </button>
));

FilterChip.displayName = 'FilterChip';

const BuyerPage = () => {
  const { darkMode } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [condition, setCondition] = useState('all');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyViewed, setRecentlyViewed] = useState(() => getRecentlyViewed());

  const sortOptions = useMemo(() => [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'condition-best', label: 'Condition: Best First' },
    { value: 'most-viewed', label: 'Most Viewed' }
  ], []);

  // Use React Query for data fetching with staleTime
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () => getProducts({
      category: selectedCategory !== 'All' ? selectedCategory : undefined
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const products = productsData || [];

  // Memoized handlers
  const handleProductView = useCallback((product) => {
    addToRecentlyViewed(product);
    setRecentlyViewed(getRecentlyViewed());
  }, []);

  const handleClearRecentlyViewed = useCallback(() => {
    clearRecentlyViewed();
    setRecentlyViewed([]);
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedCategory('All');
    setCondition('all');
    setSortBy('newest');
  }, []);

  // Memoize filtered and sorted products
  const sortedProducts = useMemo(() => {
    const filtered = products.filter(product => {
      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          product.title.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.location.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (selectedCategory !== 'All' && product.category !== selectedCategory) return false;
      if (condition !== 'all' && product.condition !== condition) return false;
      return true;
    });

    // Sort filtered products
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.posted_date) - new Date(a.posted_date);
        case 'oldest':
          return new Date(a.posted_date) - new Date(b.posted_date);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'condition-best':
          return b.condition_score - a.condition_score;
        case 'most-viewed':
          return b.views - a.views;
        default:
          return 0;
      }
    });
  }, [products, searchQuery, selectedCategory, condition, sortBy]);

  const activeFiltersCount = useMemo(() => 
    [selectedCategory !== 'All', condition !== 'all'].filter(Boolean).length,
    [selectedCategory, condition]
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm font-medium border transition-all duration-200 ${
                darkMode 
                  ? 'bg-[#212121] border-neutral-700 text-neutral-200 placeholder-slate-400 focus:border-indigo-500'
                  : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-indigo-400'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
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
        {recentlyViewed.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-sm font-bold ${darkMode ? 'text-neutral-200' : 'text-slate-900'}`}>
                Recently Viewed
              </h2>
              <button
                onClick={handleClearRecentlyViewed}
                className={`flex items-center gap-1 text-xs font-medium ${darkMode ? 'text-neutral-400 hover:text-red-400' : 'text-slate-500 hover:text-red-600'} transition-colors`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
                {recentlyViewed.slice(0, 6).map((product) => (
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
                <span className="hidden sm:inline">{sortOptions.find(opt => opt.value === sortBy)?.label || 'Sort'}</span>
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
                          setSortBy(option.value);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                          sortBy === option.value
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
            <p className={`text-sm ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`} data-testid="results-count">
              <span className={`font-bold ${darkMode ? 'text-neutral-200' : 'text-slate-900'}`}>{sortedProducts.length}</span> results
              {selectedCategory !== 'All' && (
                <span className="ml-1">in <span className="font-semibold text-indigo-600">{selectedCategory}</span></span>
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

              {/* Category Section */}
              <div className="mb-6">
                <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>Category</h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <FilterChip
                      key={cat}
                      label={cat}
                      active={selectedCategory === cat}
                      onClick={() => setSelectedCategory(cat)}
                      testId={`category-filter-${cat.toLowerCase()}`}
                      darkMode={darkMode}
                    />
                  ))}
                </div>
              </div>

              {/* Condition Section */}
              <div className="mb-6">
                <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>Condition</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'All Conditions', val: 'all', testId: 'condition-filter-all' },
                    { label: 'Like New', val: 'Like New', testId: 'condition-filter-like-new' },
                    { label: 'Excellent', val: 'Excellent', testId: 'condition-filter-excellent' },
                    { label: 'Good', val: 'Good', testId: 'condition-filter-good' },
                    { label: 'Fair', val: 'Fair', testId: 'condition-filter-fair' },
                  ].map(({ label, val, testId }) => (
                    <FilterChip
                      key={val}
                      label={label}
                      active={condition === val}
                      onClick={() => setCondition(val)}
                      testId={testId}
                      darkMode={darkMode}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-neutral-700">
                <button
                  onClick={() => {
                    resetFilters();
                    setFilterDrawerOpen(false);
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors ${
                    darkMode 
                      ? 'bg-slate-700 text-neutral-300 hover:bg-neutral-700' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
          {isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : (
            sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} onView={handleProductView} />
            ))
          )}
        </div>

        {/* Empty state */}
        {sortedProducts.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className={`text-lg font-semibold mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`} data-testid="no-results-message">
              No products found
            </p>
            <p className={`text-sm mb-6 ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`}>Try adjusting your filters</p>
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

