import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SellerDemandBanner from '../components/SellerDemandBanner';
import { categories } from '../data/categories';
import { Edit2, Trash2, CheckCircle2, Plus, Eye, Search, X, ChevronDown, ArrowUpDown, SlidersHorizontal, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSellerProducts, useDeleteProduct, useMarkProductAsSold, useMarkProductAsActive } from '../hooks/useProducts';

const SellerPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { currentUser } = useAuth();
  
  // React Query hooks - Backend already returns seller info embedded!
  const { data: myListings = [], isLoading: loading } = useSellerProducts();
  
  // Debug: Log when myListings changes
  React.useEffect(() => {
    console.log('[SellerPage] myListings updated:', myListings.length, 'items');
    console.log('[SellerPage] First 3 products:', myListings.slice(0, 3).map(p => ({
      id: p.id,
      title: p.title,
      is_active: p.is_active
    })));
  }, [myListings]);
  
  const deleteProductMutation = useDeleteProduct();
  const markAsSoldMutation = useMarkProductAsSold();
  const markAsActiveMutation = useMarkProductAsActive();
  
  // Clean state management
  const [filters, setFilters] = useState({
    category: 'All',
    status: 'all',
    condition: 'all',
  });
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI State
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  
  // Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMarkAsSoldModal, setShowMarkAsSoldModal] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState(null);
  const [markAsSoldProductId, setMarkAsSoldProductId] = useState(null);
  const [markAsSoldCurrentStatus, setMarkAsSoldCurrentStatus] = useState(true);
  const [interestedBuyers, setInterestedBuyers] = useState([]);
  const [selectedBuyerId, setSelectedBuyerId] = useState(null);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState(false);

  const statusOptions = ['all', 'active', 'sold'];
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'most-viewed', label: 'Most Viewed' }
  ];

  // Filter and sort listings (lightweight - data already from backend)
  const filteredAndSortedListings = useMemo(() => {
    let filtered = myListings.filter(product => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          product.title.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category !== 'All' && product.category !== filters.category) return false;

      // Condition filter
      if (filters.condition !== 'all' && product.condition !== filters.condition) return false;

      // Status filter
      if (filters.status !== 'all') {
        const isActive = product.is_active === true; // Explicitly check for true
        if (filters.status === 'active' && !isActive) return false;
        if (filters.status === 'sold' && isActive) return false;
      }

      return true;
    });

    // Sort
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.posted_date || b.postedDate) - new Date(a.posted_date || a.postedDate);
        case 'oldest':
          return new Date(a.posted_date || a.postedDate) - new Date(b.posted_date || b.postedDate);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'most-viewed':
          return b.views - a.views;
        default:
          return 0;
      }
    });
  }, [myListings, searchQuery, filters, sortBy]);

  const activeCount = myListings.filter(p => p.is_active === true).length;
  const soldCount = myListings.filter(p => p.is_active === false).length;
  const totalRevenue = myListings.filter(p => p.is_active === false).reduce((sum, p) => sum + p.price, 0);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'All') count++;
    if (filters.condition !== 'all') count++;
    if (filters.status !== 'all') count++;
    return count;
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFilters({ category: 'All', status: 'all', condition: 'all' });
    setSortBy('newest');
    setSearchQuery('');
  }, []);

  const handleEdit = useCallback((productId) => {
    navigate(`/edit-listing/${productId}`);
  }, [navigate]);

  const handleDelete = useCallback((productId) => {
    console.log('[SellerPage] handleDelete called with productId:', productId);
    console.log('[SellerPage] productId type:', typeof productId);
    setDeleteProductId(productId);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteProductId) return;
    setConfirmingAction(true);
    
    try {
      console.log('[SellerPage] Deleting product:', deleteProductId);
      await deleteProductMutation.mutateAsync(deleteProductId);
      console.log('[SellerPage] Delete successful');
      setShowDeleteModal(false);
      setDeleteProductId(null);
    } catch (error) {
      console.error('[SellerPage] Failed to delete product:', error);
      console.error('[SellerPage] Error details:', {
        message: error?.message,
        detail: error?.detail,
        error: error?.error
      });
      // The toast is already shown by the hook's onError
    } finally {
      setConfirmingAction(false);
    }
  }, [deleteProductId, deleteProductMutation]);

  const handleMarkAsSold = useCallback(async (productId, currentIsActive) => {
    setMarkAsSoldProductId(productId);
    setMarkAsSoldCurrentStatus(currentIsActive);
    setShowMarkAsSoldModal(true); // Show modal immediately
    
    // Fetch buyers in background (don't block modal)
    if (currentIsActive) {
      setLoadingBuyers(true);
      setInterestedBuyers([]); // Clear previous buyers
      
      // Fetch asynchronously without blocking
      import('../services/api-service')
        .then(({ getInterestedBuyers }) => getInterestedBuyers(productId))
        .then((buyers) => {
          setInterestedBuyers(Array.isArray(buyers) ? buyers : []);
        })
        .catch((error) => {
          console.error('Failed to fetch interested buyers:', error);
          setInterestedBuyers([]);
        })
        .finally(() => {
          setLoadingBuyers(false);
        });
    }
  }, []);

  const confirmMarkAsSold = useCallback(async () => {
    if (!markAsSoldProductId) {
      console.error('No product ID set');
      return;
    }
    
    console.log('Confirming mark as sold:', {
      productId: markAsSoldProductId,
      currentStatus: markAsSoldCurrentStatus,
      buyerId: selectedBuyerId
    });
    
    console.log('Decision: Will call', markAsSoldCurrentStatus ? 'MARK AS SOLD' : 'MARK AS ACTIVE');
    
    setConfirmingAction(true);
    
    try {
      if (markAsSoldCurrentStatus) {
        // Marking as sold
        console.log('Calling markAsSoldMutation...');
        const result = await markAsSoldMutation.mutateAsync({ 
          productId: markAsSoldProductId, 
          buyerId: selectedBuyerId || undefined // Convert null to undefined
        });
        console.log('Mark as sold result:', result);
      } else {
        // Marking as active
        console.log('Calling markAsActiveMutation...');
        const result = await markAsActiveMutation.mutateAsync(markAsSoldProductId);
        console.log('Mark as active result:', result);
      }
      
      console.log('Success! Closing modal...');
      setShowMarkAsSoldModal(false);
      setMarkAsSoldProductId(null);
      setSelectedBuyerId(null);
      setInterestedBuyers([]);
    } catch (error) {
      console.error('Failed to update product status:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      // Error toast is handled by React Query hook
    } finally {
      setConfirmingAction(false);
    }
  }, [markAsSoldProductId, markAsSoldCurrentStatus, selectedBuyerId, markAsSoldMutation, markAsActiveMutation]);

  const FilterChip = ({ label, active, onClick, testId }) => (
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
  );

  return (
    <div className={`min-h-[100dvh] pb-20 ${darkMode ? 'bg-[#0f0f0f]' : 'bg-slate-50'}`}>
      <Header hideSearch />
      
      <div className="px-4 sm:px-6 md:px-10 lg:px-20 py-8 with-bottom-nav">
        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className={`font-['Outfit'] text-2xl sm:text-3xl font-black mb-1 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`} data-testid="seller-page-title">
              My Listings
            </h1>
            <p className={`text-sm ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>Manage your campus products</p>
          </div>
          <button
            onClick={() => navigate('/post-listing')}
            className="btn-gradient flex items-center gap-2 px-5 py-2.5 text-sm"
            data-testid="post-new-listing-btn"
          >
            <Plus className="h-4 w-4" />
            New Listing
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-7">
          <div className={`rounded-2xl border p-4 text-center ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200 shadow-sm'}`} data-testid="seller-stat-active">
            <div className="text-xl sm:text-2xl font-black text-indigo-600 mb-0.5">{activeCount}</div>
            <div className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>Active</div>
          </div>
          <div className={`rounded-2xl border p-4 text-center ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200 shadow-sm'}`} data-testid="seller-stat-sold">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 mb-0.5">{soldCount}</div>
            <div className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>Sold</div>
          </div>
          <div className={`rounded-2xl border p-4 text-center ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200 shadow-sm'}`} data-testid="seller-stat-revenue">
            <div className="text-xl sm:text-2xl font-black text-amber-600 mb-0.5">₹{(totalRevenue / 1000).toFixed(0)}k</div>
            <div className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>Revenue</div>
          </div>
        </div>

        {/* Seller Demand Banner */}
        <div className="mb-7">
          <SellerDemandBanner />
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Search your listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Just update search, no history needed
                }
              }}
              className={`w-full pl-12 pr-4 py-3.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                darkMode 
                  ? 'bg-[#212121] border-neutral-700 text-neutral-200 placeholder-neutral-500 focus:border-indigo-500'
                  : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-indigo-300'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Removed search history - not needed */}
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-3 pb-2 relative">
            <div className="flex items-center gap-3 overflow-x-auto flex-1">
              {/* Combined Filters Button */}
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

            {/* Sort Dropdown - Outside overflow container */}
            <div className="relative flex-shrink-0 ml-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSortDropdownOpen(!sortDropdownOpen);
                }}
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

              {/* Sort Popup */}
              {sortDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-[60]" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSortDropdownOpen(false);
                    }}
                  />
                  <div className={`absolute top-full right-0 mt-2 rounded-xl border shadow-xl z-[61] min-w-[200px] ${
                    darkMode 
                      ? 'bg-[#212121] border-neutral-700' 
                      : 'bg-white border-slate-200'
                  }`}>
                    {sortOptions.map((option, index) => (
                      <button
                        key={option.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSortBy(option.value);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                          sortBy === option.value
                            ? darkMode
                              ? 'bg-indigo-600 text-white'
                              : 'bg-indigo-50 text-indigo-600'
                            : darkMode
                              ? 'text-neutral-300 hover:bg-neutral-800'
                              : 'text-slate-700 hover:bg-slate-50'
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
              <span className={`font-bold ${darkMode ? 'text-neutral-200' : 'text-slate-900'}`}>{filteredAndSortedListings.length}</span> listings
              {filters.category !== 'All' && (
                <span className="ml-1">in <span className="font-semibold text-indigo-600">{filters.category}</span></span>
              )}
            </p>
          </div>
        </div>

        {/* ===== UNIFIED FILTER DRAWER ===== */}
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
                      active={filters.category === cat}
                      onClick={() => setFilters(prev => ({ ...prev, category: cat }))}
                      testId={`category-filter-${cat.toLowerCase()}`}
                    />
                  ))}
                </div>
              </div>

              {/* Status Section */}
              <div className="mb-6">
                <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>Status</h4>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <FilterChip
                      key={status}
                      label={status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                      active={filters.status === status}
                      onClick={() => setFilters(prev => ({ ...prev, status }))}
                      testId={`status-filter-${status}`}
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
                      active={filters.condition === val}
                      onClick={() => setFilters(prev => ({ ...prev, condition: val }))}
                      testId={testId}
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

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredAndSortedListings.map((product) => {
            const isSold = product.is_active === false; // Explicitly check for false
            return (
              <div
                key={product.id}
                className={`group rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                  isSold ? 'opacity-60' : ''
                } ${
                  darkMode 
                    ? 'bg-[#212121] border-neutral-700 hover:border-indigo-500 hover:shadow-lg'
                    : 'bg-white border-slate-200 hover:border-indigo-400/40 hover:shadow-card-hover'
                }`}
                data-testid={`seller-listing-${product.id}`}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Sold Badge */}
                  {isSold && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider">
                        Sold
                      </span>
                    </div>
                  )}
                  {/* Views Badge */}
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                    <Eye className="h-3 w-3 text-white" />
                    <span className="text-xs text-white font-medium">{product.views}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className={`text-lg font-bold mb-2 line-clamp-1 ${darkMode ? 'text-neutral-200' : 'text-slate-900'}`} data-testid="seller-listing-title">
                    {product.title}
                  </h3>
                  <div className="text-2xl font-black text-indigo-600 mb-3" data-testid="seller-listing-price">
                    ₹{product.price.toLocaleString()}
                  </div>

                  {/* Condition & Location */}
                  <div className={`flex items-center gap-2 mb-5 pb-5 border-b ${darkMode ? 'border-neutral-700' : 'border-slate-100'}`}>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-semibold">
                      {product.condition}
                    </span>
                    <span className={`text-sm ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>{product.location}</span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleEdit(product.id)}
                      className={`flex items-center justify-center py-2 rounded-xl border transition-all text-xs font-medium ${
                        darkMode 
                          ? 'border-neutral-700 hover:border-indigo-500 hover:bg-indigo-900/30 hover:text-indigo-400 text-neutral-400'
                          : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600'
                      }`}
                      data-testid="seller-listing-edit-btn"
                      title="Edit Listing"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className={`flex items-center justify-center py-2 rounded-xl border transition-all text-xs font-medium ${
                        darkMode 
                          ? 'border-neutral-700 hover:border-red-500 hover:bg-red-900/30 hover:text-red-400 text-neutral-400'
                          : 'border-slate-200 hover:border-red-400 hover:bg-red-50 hover:text-red-600 text-slate-600'
                      }`}
                      data-testid="seller-listing-delete-btn"
                      title="Delete Listing"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMarkAsSold(product.id, product.is_active === true)}
                      className={`flex items-center justify-center py-2 rounded-xl border transition-all text-xs font-medium ${
                        isSold
                          ? darkMode
                            ? 'border-emerald-500 bg-emerald-900/30 text-emerald-400'
                            : 'border-emerald-400 bg-emerald-50 text-emerald-700'
                          : darkMode 
                            ? 'border-neutral-700 hover:border-emerald-500 hover:bg-emerald-900/30 hover:text-emerald-400 text-neutral-400'
                            : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600'
                      }`}
                      data-testid="seller-listing-sold-btn"
                      title={isSold ? "Mark as Active" : "Mark as Sold"}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in" onClick={() => setShowDeleteModal(false)} />
            <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 rounded-2xl shadow-2xl animate-scale-in ${
              darkMode ? 'bg-[#212121]' : 'bg-white'
            }`}>
              <div className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-neutral-200' : 'text-slate-900'}`}>
                  Delete Listing?
                </h3>
                <p className={`text-sm mb-6 ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
                  This action cannot be undone. The listing will be permanently removed.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={confirmingAction}
                    className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                      confirmingAction ? 'opacity-50 cursor-not-allowed' : ''
                    } ${
                      darkMode 
                        ? 'bg-slate-700 text-neutral-300 hover:bg-neutral-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={confirmingAction}
                    className={`flex-1 py-2.5 rounded-xl font-semibold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2 ${
                      confirmingAction ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {confirmingAction ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mark as Sold/Active Confirmation Modal */}
        {showMarkAsSoldModal && (
          <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in" onClick={() => {
              setShowMarkAsSoldModal(false);
              setSelectedBuyerId(null);
              setInterestedBuyers([]);
            }} />
            <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg p-6 rounded-2xl shadow-2xl animate-scale-in max-h-[80vh] overflow-y-auto ${
              darkMode ? 'bg-[#212121]' : 'bg-white'
            }`}>
              <div className="text-center">
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  markAsSoldCurrentStatus ? 'bg-emerald-100' : 'bg-indigo-100'
                }`}>
                  <CheckCircle2 className={`h-6 w-6 ${
                    markAsSoldCurrentStatus ? 'text-emerald-600' : 'text-indigo-600'
                  }`} />
                </div>
                <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-neutral-200' : 'text-slate-900'}`}>
                  {markAsSoldCurrentStatus ? 'Mark as Sold' : 'Mark as Active?'}
                </h3>
                
                {markAsSoldCurrentStatus ? (
                  <>
                    <p className={`text-sm mb-4 ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
                      {loadingBuyers 
                        ? 'Loading interested buyers...'
                        : interestedBuyers.length > 0 
                          ? 'Select the buyer who purchased this product (optional):' 
                          : 'No users have messaged about this product yet.'}
                    </p>
                    
                    {loadingBuyers ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : interestedBuyers.length > 0 ? (
                      <>
                        <div className="mb-4 max-h-60 overflow-y-auto">
                          <div className="space-y-2">
                            {/* Skip buyer selection option */}
                            <button
                              onClick={() => setSelectedBuyerId(null)}
                              className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                                selectedBuyerId === null
                                  ? darkMode
                                    ? 'border-indigo-500 bg-indigo-900/20'
                                    : 'border-indigo-500 bg-indigo-50'
                                  : darkMode
                                    ? 'border-neutral-700 hover:border-neutral-600 bg-neutral-800/50'
                                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  darkMode ? 'bg-neutral-700' : 'bg-slate-200'
                                }`}>
                                  <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-semibold text-sm ${darkMode ? 'text-neutral-200' : 'text-slate-900'}`}>
                                    Skip buyer selection
                                  </p>
                                  <p className={`text-xs ${darkMode ? 'text-neutral-500' : 'text-slate-500'}`}>
                                    Mark as sold without selecting a buyer
                                  </p>
                                </div>
                                {selectedBuyerId === null && (
                                  <CheckCircle2 className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                                )}
                              </div>
                            </button>
                            
                            {interestedBuyers.map((buyer) => (
                              <button
                                key={buyer.id}
                                onClick={() => setSelectedBuyerId(buyer.id === selectedBuyerId ? null : buyer.id)}
                                className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                                  selectedBuyerId === buyer.id
                                    ? darkMode
                                      ? 'border-emerald-500 bg-emerald-900/20'
                                      : 'border-emerald-500 bg-emerald-50'
                                    : darkMode
                                      ? 'border-neutral-700 hover:border-neutral-600 bg-neutral-800/50'
                                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {buyer.avatar ? (
                                    <img 
                                      src={buyer.avatar} 
                                      alt={buyer.name}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                      darkMode ? 'bg-neutral-700' : 'bg-slate-200'
                                    }`}>
                                      <User className="h-5 w-5" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-semibold text-sm ${darkMode ? 'text-neutral-200' : 'text-slate-900'}`}>
                                      {buyer.name}
                                    </p>
                                    {buyer.last_message && (
                                      <p className={`text-xs truncate ${darkMode ? 'text-neutral-500' : 'text-slate-500'}`}>
                                        {buyer.last_message}
                                      </p>
                                    )}
                                  </div>
                                  {selectedBuyerId === buyer.id && (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                        <p className={`text-xs mb-4 ${darkMode ? 'text-neutral-500' : 'text-slate-400'}`}>
                          💡 Tip: Selecting a buyer will create a transaction record for both parties
                        </p>
                      </>
                    ) : (
                      <p className={`text-xs mb-4 ${darkMode ? 'text-neutral-500' : 'text-slate-400'}`}>
                        You can mark this product as sold without selecting a buyer
                      </p>
                    )}
                  </>
                ) : (
                  <p className={`text-sm mb-6 ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
                    This will mark the product as active and make it available for sale again. Previous sale information will be cleared.
                  </p>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowMarkAsSoldModal(false);
                      setSelectedBuyerId(null);
                      setInterestedBuyers([]);
                    }}
                    disabled={confirmingAction}
                    className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                      confirmingAction ? 'opacity-50 cursor-not-allowed' : ''
                    } ${
                      darkMode 
                        ? 'bg-slate-700 text-neutral-300 hover:bg-neutral-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmMarkAsSold}
                    disabled={confirmingAction}
                    className={`flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-colors flex items-center justify-center gap-2 ${
                      confirmingAction ? 'opacity-75 cursor-not-allowed' : ''
                    } ${
                      markAsSoldCurrentStatus 
                        ? 'bg-emerald-600 hover:bg-emerald-700' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {confirmingAction ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {markAsSoldCurrentStatus ? 'Marking as Sold...' : 'Marking as Active...'}
                      </>
                    ) : (
                      markAsSoldCurrentStatus ? 'Confirm Sale' : 'Mark as Active'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {filteredAndSortedListings.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📦</div>
            <p className={`text-lg font-semibold mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>No listings found</p>
            <p className={`text-sm mb-6 ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`}>
              {myListings.length === 0 ? 'Post your first item to start selling' : 'Try adjusting your filters'}
            </p>
            {myListings.length === 0 ? (
              <button
                onClick={() => navigate('/post-listing')}
                className="btn-gradient px-6 py-2.5 text-sm inline-flex items-center gap-2"
                data-testid="empty-post-listing-btn"
              >
                <Plus className="h-4 w-4" />
                Post First Listing
              </button>
            ) : (
              <button onClick={resetFilters} className="btn-gradient px-6 py-2.5 text-sm">
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerPage;

