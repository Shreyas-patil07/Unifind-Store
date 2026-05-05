import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { TrendingUp, MessageCircle, Bookmark, Clock, Tag, DollarSign } from 'lucide-react';
import { getSellerNeedFeed, saveNeed } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const SellerDemandFeedPage = () => {
  const { currentUser } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [needs, setNeeds] = useState([]);
  const [savedNeeds, setSavedNeeds] = useState(new Set());

  useEffect(() => {
    if (currentUser) {
      fetchNeedFeed();
    }
  }, [currentUser]);

  const fetchNeedFeed = async () => {
    try {
      setLoading(true);
      const idToken = await currentUser.getIdToken();
      const data = await getSellerNeedFeed(idToken);
      setNeeds(data.needs || []);
    } catch (err) {
      console.error('Failed to fetch need feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNeed = async (needId, e) => {
    e.stopPropagation();
    
    try {
      const idToken = await currentUser.getIdToken();
      await saveNeed(needId, idToken);
      setSavedNeeds(prev => new Set([...prev, needId]));
    } catch (err) {
      console.error('Failed to save need:', err);
    }
  };

  const handleMessageBuyer = (need, e) => {
    e.stopPropagation();
    // Navigate to chat with buyer
    navigate(`/chat?user=${need.user_id}`);
  };

  const handlePostItem = (e) => {
    e.stopPropagation();
    navigate('/post-listing');
  };

  const getTimeAgo = (timestamp) => {
    const now = Date.now();
    const createdAt = timestamp?.toMillis ? timestamp.toMillis() : new Date(timestamp).getTime();
    const diff = now - createdAt;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getRelevanceBadgeClass = (score) => {
    if (score >= 70) return 'bg-green-100 text-green-700';
    if (score >= 50) return 'bg-blue-100 text-blue-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  return (
    <div className={`min-h-[100dvh] pb-20 ${darkMode ? 'bg-[#0f0f0f]' : 'bg-slate-50'}`}>
      <Header hideSearch />

      <div className="px-6 sm:px-8 md:px-12 lg:px-24 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h1 className={`font-['Outfit'] text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Buyer Demand Feed
              </h1>
            </div>
            <p className={`text-base ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
              Buyers looking for items you can sell
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`rounded-2xl border p-6 ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'}`}
                >
                  <div className={`h-4 w-3/4 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded animate-pulse mb-3`} />
                  <div className={`h-4 w-1/2 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded animate-pulse`} />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && needs.length === 0 && (
            <div className={`rounded-2xl border p-12 text-center ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'}`}>
              <TrendingUp className={`h-16 w-16 mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-neutral-300'}`} />
              <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>
                No relevant buyer needs yet
              </h2>
              <p className={`text-sm mb-6 ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`}>
                List more items to see buyer demand that matches your inventory
              </p>
              <button
                onClick={handlePostItem}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all"
              >
                Post an Item
              </button>
            </div>
          )}

          {/* Needs List */}
          {!loading && needs.length > 0 && (
            <div className="space-y-4">
              {needs.map((need) => {
                const isSaved = savedNeeds.has(need.id);
                const timeAgo = getTimeAgo(need.created_at);
                const relevanceScore = need.relevance_score || 0;

                return (
                  <div
                    key={need.id}
                    className={`rounded-2xl border p-6 transition-all hover:shadow-lg ${
                      darkMode 
                        ? 'bg-[#212121] border-neutral-700 hover:border-slate-600' 
                        : 'bg-white border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getRelevanceBadgeClass(relevanceScore)}`}>
                            {relevanceScore}% match
                          </span>
                          <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`}>
                            <Clock className="h-3 w-3 inline mr-1" />
                            {timeAgo}
                          </span>
                        </div>
                        <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                          {need.title}
                        </h3>
                        <p className={`text-sm mb-3 ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
                          {need.raw_text}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`text-xs px-3 py-1 rounded-full ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                        <Tag className="h-3 w-3 inline mr-1" />
                        {need.category}
                      </span>
                      {need.price_range && (
                        <span className={`text-xs px-3 py-1 rounded-full ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                          <DollarSign className="h-3 w-3 inline mr-1" />
                          Budget: ₹{need.price_range.min} - ₹{need.price_range.max}
                        </span>
                      )}
                      {need.tags && need.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className={`text-xs px-3 py-1 rounded-full ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Buyer Info */}
                    {need.buyer_name && (
                      <div className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Posted by {need.buyer_name} • {need.buyer_college}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={handlePostItem}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all text-sm font-medium"
                      >
                        Post Matching Item
                      </button>
                      <button
                        onClick={(e) => handleMessageBuyer(need, e)}
                        className={`px-4 py-2 rounded-xl transition-all text-sm font-medium ${
                          darkMode 
                            ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <MessageCircle className="h-4 w-4 inline mr-1" />
                        Message
                      </button>
                      <button
                        onClick={(e) => handleSaveNeed(need.id, e)}
                        disabled={isSaved}
                        className={`px-4 py-2 rounded-xl transition-all text-sm font-medium ${
                          isSaved
                            ? darkMode 
                              ? 'bg-green-900/30 text-green-400' 
                              : 'bg-green-100 text-green-700'
                            : darkMode 
                              ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' 
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Bookmark className={`h-4 w-4 inline ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDemandFeedPage;
