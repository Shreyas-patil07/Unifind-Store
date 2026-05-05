import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Eye, MessageCircle, Heart, Share2 } from 'lucide-react';
import { getPublicProfile } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ShareModal from './ShareModal';

const conditionConfig = {
  'Like New': { color: 'bg-emerald-500', label: 'Like New' },
  'Excellent': { color: 'bg-teal-500', label: 'Excellent' },
  'Good': { color: 'bg-amber-500', label: 'Good' },
  'Fair': { color: 'bg-orange-500', label: 'Fair' },
};

const ProductCard = ({ product, onView }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { darkMode } = useTheme();
  const [isLiked, setIsLiked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const condition = conditionConfig[product.condition] || { color: 'bg-slate-500', label: product.condition };

  // Seller info is now embedded in product (no API call needed!)
  const seller = product.seller || { id: product.seller_id, name: 'Unknown', avatar: null };

  // Load liked state from localStorage
  useEffect(() => {
    if (currentUser) {
      const likedProducts = JSON.parse(localStorage.getItem(`liked_products_${currentUser.uid}`) || '[]');
      setIsLiked(likedProducts.includes(product.id));
    }
  }, [currentUser, product.id]);



  const handleCardClick = () => {
    if (onView) onView(product);
    navigate(`/listing/${product.id}`);
  };

  const handleLike = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const likedProducts = JSON.parse(localStorage.getItem(`liked_products_${currentUser.uid}`) || '[]');
    
    if (isLiked) {
      // Remove from liked
      const updated = likedProducts.filter(id => id !== product.id);
      localStorage.setItem(`liked_products_${currentUser.uid}`, JSON.stringify(updated));
      setIsLiked(false);
    } else {
      // Add to liked
      const updated = [...likedProducts, product.id];
      localStorage.setItem(`liked_products_${currentUser.uid}`, JSON.stringify(updated));
      setIsLiked(true);
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowShareModal(true);
  };



  return (
    <div
      className={`group flex flex-col rounded-2xl border cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover ${
        darkMode 
          ? 'bg-[#212121] border-neutral-700 hover:border-indigo-500/50' 
          : 'bg-white border-slate-200 hover:border-indigo-300/50'
      }`}
      onClick={handleCardClick}
      data-testid={`product-card-${product.id}`}
    >
      {/* ===== IMAGE ===== */}
      <div className={`relative aspect-[4/3] overflow-hidden rounded-t-2xl ${darkMode ? 'bg-neutral-800' : 'bg-slate-100'}`}>
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          data-testid="product-card-image"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Status and Condition Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {/* Status Badge - SOLD or ACTIVE */}
          {!product.is_active ? (
            <span
              className="bg-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
              data-testid="product-status-badge"
            >
              SOLD
            </span>
          ) : (
            <span
              className="bg-green-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
              data-testid="product-status-badge"
            >
              ACTIVE
            </span>
          )}
          
          {/* Condition Badge */}
          <span
            className={`${condition.color} px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm`}
            data-testid="product-condition-badge"
          >
            {condition.label}
          </span>
          
          {/* Negotiable Badge */}
          {product.negotiable && (
            <span
              className="bg-blue-500 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
              data-testid="product-negotiable-badge"
            >
              Negotiable
            </span>
          )}
        </div>

        {/* Views badge */}
        <div className="absolute top-2.5 right-2.5 flex gap-1.5">
          <div className="bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-lg flex items-center gap-1">
            <Eye className="h-3 w-3 text-white" />
            <span className="text-[10px] text-white font-medium">{product.views}</span>
          </div>
        </div>

        {/* Like and Share buttons */}
        <div className="absolute bottom-2.5 right-2.5 flex gap-1.5">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`p-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 active:scale-95 ${
              isLiked 
                ? 'bg-red-500 text-white' 
                : 'bg-white/90 text-slate-700 hover:bg-white'
            }`}
            data-testid="product-like-btn"
            title={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-white transition-all duration-200 active:scale-95"
            data-testid="product-share-btn"
            title="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="p-3.5 flex-1 flex flex-col">
        {/* Title */}
        <h3
          className={`text-sm font-bold mb-1.5 line-clamp-2 leading-snug ${darkMode ? 'text-neutral-100' : 'text-slate-900'}`}
          data-testid="product-title"
        >
          {product.title}
        </h3>

        {/* Price */}
        <div
          className={`text-lg font-black mb-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}
          data-testid="product-price"
        >
          ₹{product.price.toLocaleString()}
        </div>

        {/* Location */}
        <div className={`flex items-center gap-1 text-xs mb-3 ${darkMode ? 'text-neutral-500' : 'text-slate-400'}`}>
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate" data-testid="product-location">{product.location}</span>
        </div>

        {/* Seller row */}
        <div 
          className={`flex items-center gap-2 mb-3 pb-3 border-b cursor-pointer hover:bg-opacity-50 transition-colors ${darkMode ? 'border-neutral-700 hover:bg-neutral-800' : 'border-slate-100 hover:bg-slate-50'}`}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${product.seller_id}`);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              navigate(`/profile/${product.seller_id}`);
            }
          }}
        >
          <img
            src={seller?.avatar}
            alt={seller?.name}
            className={`h-6 w-6 rounded-full object-cover ring-1 flex-shrink-0 ${darkMode ? 'ring-neutral-700' : 'ring-slate-200'}`}
            data-testid="seller-avatar"
          />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold truncate ${darkMode ? 'text-neutral-300 hover:text-indigo-400' : 'text-slate-800 hover:text-indigo-600'}`} data-testid="seller-name">
              {seller?.name?.split(' ')[0] || seller?.name}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <button
            className={`flex-1 border text-xs font-semibold py-2 rounded-xl transition-all duration-200 active:scale-95 ${
              darkMode 
                ? 'border-neutral-700 hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-400 text-neutral-300'
                : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700'
            }`}
            onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
            data-testid="product-view-btn"
          >
            View
          </button>
          <button
            className={`flex-1 text-white text-xs font-semibold py-2 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 ${
              darkMode ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!currentUser) {
                navigate('/login');
                return;
              }
              // Navigate to chat with seller and product context
              navigate(`/chat?user=${product.seller_id}&product=${product.id}`); 
            }}
            data-testid="product-chat-btn"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Chat
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          url={`/listing/${product.id}`}
          title={product.title}
          price={product.price}
        />
      )}
    </div>
  );
};

export default ProductCard;
