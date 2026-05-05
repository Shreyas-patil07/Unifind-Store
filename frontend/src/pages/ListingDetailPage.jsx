import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Button } from '../components/ui/Button';
import { ArrowLeft, MapPin, Eye, Share2, Heart, MessageCircle, Shield } from 'lucide-react';
import { getProduct, getPublicProfile } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { hasViewedProduct, markProductAsViewed } from '../utils/viewTracking';
import { isProductLiked, likeProduct, unlikeProduct } from '../utils/likedProducts';
import ShareModal from '../components/ShareModal';

const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { darkMode } = useTheme();
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const loadProductDetails = async () => {
      try {
        // Check if already viewed in this session
        const alreadyViewed = hasViewedProduct(id);
        
        // Get ID token if user is logged in
        const idToken = currentUser ? await currentUser.getIdToken() : null;
        
        // Only fetch with token if not already viewed
        // This prevents unnecessary view increments
        const productData = await getProduct(id, !alreadyViewed ? idToken : null);
        setProduct(productData);

        // Update meta tags for social sharing
        if (productData) {
          document.title = `${productData.title} - ₹${productData.price.toLocaleString()} | UNIFIND`;
          
          // Update or create meta tags
          updateMetaTag('description', productData.description);
          updateMetaTag('og:type', 'product', 'property');
          updateMetaTag('og:url', window.location.href, 'property');
          updateMetaTag('og:title', `${productData.title} - ₹${productData.price.toLocaleString()}`, 'property');
          updateMetaTag('og:description', productData.description, 'property');
          updateMetaTag('og:image', productData.images[0], 'property');
          updateMetaTag('og:image:width', '1200', 'property');
          updateMetaTag('og:image:height', '630', 'property');
          updateMetaTag('twitter:card', 'summary_large_image');
          updateMetaTag('twitter:title', `${productData.title} - ₹${productData.price.toLocaleString()}`);
          updateMetaTag('twitter:description', productData.description);
          updateMetaTag('twitter:image', productData.images[0]);
        }

        // Mark as viewed in localStorage
        if (!alreadyViewed) {
          markProductAsViewed(id);
          console.log('Product view tracked:', id);
        } else {
          console.log('Product already viewed in this session:', id);
        }

        // Load seller info
        if (productData.seller_id) {
          const sellerData = await getPublicProfile(productData.seller_id);
          setSeller(sellerData);
        }
      } catch (error) {
        console.error('Failed to load product:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProductDetails();
  }, [id, currentUser]);

  // Helper function to update meta tags
  const updateMetaTag = (name, content, type = 'name') => {
    let element = document.querySelector(`meta[${type}="${name}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(type, name);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  useEffect(() => {
    if (currentUser && id) {
      setIsLiked(isProductLiked(currentUser.uid, id));
    }
  }, [currentUser, id]);

  const handleLike = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (isLiked) {
      unlikeProduct(currentUser.uid, id);
      setIsLiked(false);
    } else {
      likeProduct(currentUser.uid, id);
      setIsLiked(true);
    }
  };

  const handleShare = async () => {
    setShowShareModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#0f0f0f]">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#0f0f0f]">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mb-2">Product not found</h2>
            <Button onClick={() => navigate('/buyer')}>Back to Browse</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#0f0f0f]">
      <Header />
      
      <div className="px-6 sm:px-8 md:px-12 lg:px-24 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-100 mb-8 transition-colors"
          data-testid="back-btn"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left - Images */}
          <div>
            <div className="bg-white dark:bg-[#212121] rounded-2xl border border-slate-200 dark:border-neutral-700 overflow-hidden mb-4">
              <img
                src={product.images[selectedImage]}
                alt={product.title}
                className="w-full aspect-square object-cover"
                data-testid="product-main-image"
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {(Array.isArray(product.images) ? product.images : []).slice(0, 4).map((img, i) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedImage(i)}
                  className={`bg-white dark:bg-[#212121] rounded-xl border overflow-hidden cursor-pointer transition-colors ${
                    selectedImage === i ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-neutral-700 hover:border-blue-500'
                  }`}
                >
                  <img src={img} alt="" className="w-full aspect-square object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Right - Details */}
          <div>
            <div className="bg-white dark:bg-[#212121] rounded-2xl border border-slate-200 dark:border-neutral-700 p-8">
              <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-bold text-slate-900 dark:text-neutral-100 mb-4" data-testid="product-title">
                {product.title}
              </h1>
              
              <div className="text-4xl font-black text-blue-600 dark:text-blue-400 mb-6" data-testid="product-price">
                ₹{product.price.toLocaleString()}
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-neutral-700">
                <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-semibold">
                  {product.condition}
                </span>
                <div className="flex items-center gap-1 text-slate-600 dark:text-neutral-400">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{product.location}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-600 dark:text-neutral-400">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">{product.views} views</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100 mb-2">Description</h3>
                <p className="text-slate-600 dark:text-neutral-400 leading-relaxed">{product.description}</p>
              </div>

              <div className="mb-6 pb-6 border-b border-slate-100 dark:border-neutral-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100 mb-3">Seller Information</h3>
                <div 
                  className="flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800 p-3 -mx-3 rounded-lg transition-colors"
                  onClick={() => navigate(`/profile/${product.seller_id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/profile/${product.seller_id}`);
                    }
                  }}
                >
                  <img 
                    src={seller?.avatar} 
                    alt={seller?.name} 
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-200 dark:ring-neutral-700" 
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {seller?.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-neutral-500">{seller?.college}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-500/10 px-3 py-1.5 rounded-lg">
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-bold text-green-700 dark:text-green-400">{seller?.trust_score || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    if (!currentUser) {
                      navigate('/login');
                      return;
                    }
                    // Navigate to chat with seller and product context
                    navigate(`/chat?user=${product.seller_id}&product=${product.id}`);
                  }}
                  className="flex-1 bg-blue-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-blue-700 shadow-[0_0_0_1px_rgba(37,99,235,1)_inset] transition-all duration-200 active:scale-95"
                  data-testid="contact-seller-btn"
                >
                  <MessageCircle className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Contact Seller</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLike}
                  className={`rounded-xl transition-all ${
                    isLiked 
                      ? 'bg-red-50 dark:bg-red-500/10 border-red-500 hover:bg-red-100 dark:hover:bg-red-500/20' 
                      : 'border-slate-200 dark:border-neutral-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                  }`}
                  data-testid="save-btn"
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-red-500 text-red-500' : darkMode ? 'text-neutral-400' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="rounded-xl border-slate-200 dark:border-neutral-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                  data-testid="share-btn"
                >
                  <Share2 className={`h-5 w-5 ${darkMode ? 'text-neutral-400' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={window.location.href}
        title={product?.title}
        price={product?.price}
      />
    </div>
  );
};

export default ListingDetailPage;


