import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import { Button } from '../components/ui/Button';
import { Upload, X, Loader2, ArrowLeft } from 'lucide-react';
import { categories } from '../data/categories';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useProduct, useUpdateProduct } from '../hooks/useProducts';
import toast from 'react-hot-toast';

const EditListingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { darkMode } = useTheme();
  const { currentUser } = useAuth();
  
  const { data: product, isLoading } = useProduct(id);
  const updateProductMutation = useUpdateProduct(id);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    location: ''
  });

  // Load product data when available
  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        category: product.category || '',
        condition: product.condition || '',
        location: product.location || ''
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getConditionScore = (condition) => {
    const scores = {
      'Like New': 95,
      'Excellent': 85,
      'Good': 70,
      'Fair': 50
    };
    return scores[condition] || 50;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error('You must be logged in to edit a listing');
      return;
    }

    try {
      await updateProductMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        condition: formData.condition,
        condition_score: getConditionScore(formData.condition),
        location: formData.location,
      });

      navigate('/seller');
    } catch (error) {
      console.error('Failed to update listing:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-[#0f0f0f]' : 'bg-slate-50'}`}>
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-[#0f0f0f]' : 'bg-slate-50'}`}>
        <Header />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)]">
          <p className={`text-lg ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>Product not found</p>
          <Button onClick={() => navigate('/seller')} className="mt-4">
            Back to Listings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-20 ${darkMode ? 'bg-[#0f0f0f]' : 'bg-slate-50'}`}>
      <Header />
      
      <div className="px-4 sm:px-6 md:px-10 lg:px-20 py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/seller')}
            className={`flex items-center gap-2 mb-4 text-sm font-medium transition-colors ${
              darkMode ? 'text-neutral-400 hover:text-neutral-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Listings
          </button>
          <h1 className={`font-['Outfit'] text-3xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            Edit Listing
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>
            Update your product details
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength={200}
              className={`w-full px-4 py-3 rounded-xl border transition-all ${
                darkMode 
                  ? 'bg-[#212121] border-neutral-700 text-neutral-200 focus:border-indigo-500'
                  : 'bg-white border-slate-200 text-slate-700 focus:border-indigo-300'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
              placeholder="e.g., iPhone 13 Pro Max 256GB"
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              maxLength={2000}
              rows={5}
              className={`w-full px-4 py-3 rounded-xl border transition-all resize-none ${
                darkMode 
                  ? 'bg-[#212121] border-neutral-700 text-neutral-200 focus:border-indigo-500'
                  : 'bg-white border-slate-200 text-slate-700 focus:border-indigo-300'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
              placeholder="Describe your item in detail..."
            />
          </div>

          {/* Price & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="1"
                step="0.01"
                className={`w-full px-4 py-3 rounded-xl border transition-all ${
                  darkMode 
                    ? 'bg-[#212121] border-neutral-700 text-neutral-200 focus:border-indigo-500'
                    : 'bg-white border-slate-200 text-slate-700 focus:border-indigo-300'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-xl border transition-all ${
                  darkMode 
                    ? 'bg-[#212121] border-neutral-700 text-neutral-200 focus:border-indigo-500'
                    : 'bg-white border-slate-200 text-slate-700 focus:border-indigo-300'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
              >
                <option value="">Select category</option>
                {categories.filter(cat => cat !== 'All').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Condition & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>
                Condition <span className="text-red-500">*</span>
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-xl border transition-all ${
                  darkMode 
                    ? 'bg-[#212121] border-neutral-700 text-neutral-200 focus:border-indigo-500'
                    : 'bg-white border-slate-200 text-slate-700 focus:border-indigo-300'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
              >
                <option value="">Select condition</option>
                <option value="Like New">Like New</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                maxLength={200}
                className={`w-full px-4 py-3 rounded-xl border transition-all ${
                  darkMode 
                    ? 'bg-[#212121] border-neutral-700 text-neutral-200 focus:border-indigo-500'
                    : 'bg-white border-slate-200 text-slate-700 focus:border-indigo-300'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                placeholder="e.g., Campus Hostel Block A"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/seller')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                darkMode 
                  ? 'bg-slate-700 text-neutral-300 hover:bg-neutral-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProductMutation.isPending}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {updateProductMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Listing'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditListingPage;
