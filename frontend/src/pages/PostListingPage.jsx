import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Button } from '../components/ui/Button';
import { Upload, X, Loader2 } from 'lucide-react';
import { categories } from '../data/categories';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const PostListingPage = () => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: '',
    location: ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (imageFiles.length + files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    // Validate file types and sizes
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5MB');
        return;
      }
    }

    setError('');
    setImageFiles([...imageFiles, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImageFiles((Array.isArray(imageFiles) ? imageFiles : []).filter((_, i) => i !== index));
    setImagePreviews((Array.isArray(imagePreviews) ? imagePreviews : []).filter((_, i) => i !== index));
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
    setError('');

    if (!currentUser) {
      setError('You must be logged in to post a listing');
      return;
    }

    if (imageFiles.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setUploading(true);

    try {
      console.log('Starting image upload...', imageFiles.length, 'files');
      console.log('Form data:', formData);
      
      // Get Firebase ID token for authentication
      const token = await currentUser.getIdToken();

      // Upload images via backend API
      const uploadFormData = new FormData();
      imageFiles.forEach(file => {
        uploadFormData.append('files', file);
      });

      console.log('Uploading to backend...');
      const uploadResponse = await api.post('/upload/product-images', uploadFormData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const imageUrls = uploadResponse.data.urls;
      console.log('Upload complete. URLs:', imageUrls);

      if (!imageUrls || imageUrls.length === 0) {
        throw new Error('Failed to upload images. Please try again.');
      }

      // Create product
      const productData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        condition: formData.condition,
        condition_score: getConditionScore(formData.condition),
        location: formData.location,
        images: imageUrls,
        specifications: {},
        seller_id: currentUser.uid
      };

      console.log('Creating product...', productData);

      const response = await api.post('/products', productData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Product created successfully:', response.data);
      navigate('/seller');
    } catch (err) {
      console.error('Error creating listing:', err);
      
      // More detailed error message
      let errorMessage = 'Failed to create listing';
      
      if (err.message && err.message.includes('upload')) {
        errorMessage = err.message;
      } else if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(e => e.msg).join(', ');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const field = (key) => ({
    value: formData[key],
    onChange: (e) => setFormData({ ...formData, [key]: e.target.value })
  });

  return (
    <div className={`min-h-[100dvh] pb-20 ${darkMode ? 'bg-[#0f0f0f]' : 'bg-slate-50'}`}>
      <Header hideSearch />
      
      <div className="px-6 sm:px-8 md:px-12 lg:px-24 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className={`font-['Outfit'] text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`} data-testid="post-listing-title">
            Post New Listing
          </h1>
          <p className={`text-base mb-8 ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>Fill in the details to list your item</p>

          <form onSubmit={handleSubmit} className={`rounded-2xl border p-8 ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'}`}>
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Images */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-3 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>
                Product Images {imagePreviews.length > 0 && `(${imagePreviews.length}/5)`}
              </label>
              
              {/* Image Previews */}
              {Array.isArray(imagePreviews) && imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Area */}
              {imagePreviews.length < 5 && (
                <label className={`block border-2 border-dashed rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer ${darkMode ? 'border-slate-600' : 'border-slate-200'}`}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Upload className={`h-12 w-12 mx-auto mb-3 ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`} />
                  <p className={`text-sm ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>Click to upload or drag and drop</p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`}>PNG, JPG up to 5MB (max 5 images)</p>
                </label>
              )}
            </div>

            {/* Title */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>Title</label>
              <input
                type="text"
                placeholder="e.g., MacBook Pro 14-inch M1"
                maxLength={200}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition-all ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-neutral-200 placeholder-slate-400 focus:border-blue-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
                required
                {...field('title')}
              />
              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`}>
                {formData.title.length}/200 characters
              </p>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>Description</label>
              <textarea
                rows={4}
                placeholder="Describe your item..."
                maxLength={2000}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition-all resize-none ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-neutral-200 placeholder-slate-400 focus:border-blue-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
                required
                {...field('description')}
              />
              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`}>
                {formData.description.length}/2000 characters
              </p>
            </div>

            {/* Price & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>Price (₹)</label>
                <input
                  type="number"
                  placeholder="25000"
                  min="1"
                  max="10000000"
                  step="1"
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition-all ${
                    darkMode 
                      ? 'bg-slate-700 border-slate-600 text-neutral-200 placeholder-slate-400 focus:border-blue-500'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                  required
                  {...field('price')}
                />
                <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Min: ₹1, Max: ₹1,00,00,000
                </p>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>Category</label>
                <select
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition-all ${
                    darkMode 
                      ? 'bg-slate-700 border-slate-600 text-neutral-200 focus:border-blue-500'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                  required
                  {...field('category')}
                >
                  <option value="">Select category</option>
                  {categories.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Condition & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>Condition</label>
                <select
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition-all ${
                    darkMode 
                      ? 'bg-slate-700 border-slate-600 text-neutral-200 focus:border-blue-500'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                  required
                  {...field('condition')}
                >
                  <option value="">Select condition</option>
                  <option value="Like New">Like New</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>Location</label>
                <input
                  type="text"
                  placeholder="e.g., IIT Delhi"
                  maxLength={200}
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition-all ${
                    darkMode 
                      ? 'bg-slate-700 border-slate-600 text-neutral-200 placeholder-slate-400 focus:border-blue-500'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                  required
                  {...field('location')}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/seller')}
                disabled={uploading}
                className={`flex-1 rounded-xl ${darkMode ? 'border-slate-600 hover:border-slate-500 hover:bg-neutral-800' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploading}
                className="flex-1 bg-blue-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-blue-700 shadow-[0_0_0_1px_rgba(37,99,235,1)_inset] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Post Listing'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostListingPage;


