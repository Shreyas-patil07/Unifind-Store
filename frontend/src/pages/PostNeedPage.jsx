import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Sparkles, Search, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { createNeed } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const PostNeedPage = () => {
  const { darkMode } = useTheme();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!currentUser) {
        setError('You must be logged in to post a need');
        setLoading(false);
        return;
      }

      const idToken = await currentUser.getIdToken();
      const data = await createNeed(input, idToken);
      
      setResult(data);
    } catch (err) {
      console.error('Post need error:', err);
      
      if (err?.response?.status === 429) {
        const detail = err?.response?.data?.detail || 'Daily limit reached.';
        setError(`⏱️ ${detail}`);
      } else if (err?.response?.status === 401) {
        setError('🔒 Authentication failed. Please logout and login again.');
      } else {
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.error ||
          err?.message ||
          'Something went wrong. Please try again.';
        setError(`❌ ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setError(null);
    setResult(null);
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 70) return 'bg-green-100 text-green-700';
    if (score >= 40) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className={`min-h-[100dvh] pb-20 ${darkMode ? 'bg-[#0f0f0f]' : 'bg-slate-50'}`}>
      <Header hideSearch />

      <div className="px-6 sm:px-8 md:px-12 lg:px-24 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-4 py-2 mb-4">
              <Plus className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Post Your Need</span>
            </div>
            <h1
              className={`font-['Outfit'] text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}
            >
              What do you need?
            </h1>
            <p className={`text-base ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
              Describe what you're looking for, and sellers will reach out to you
            </p>
            <div className={`mt-3 text-sm font-medium ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`}>
              You can post up to 5 needs per day
            </div>
          </div>

          {/* Input Area */}
          {!result && (
            <div className={`rounded-2xl border p-8 mb-8 shadow-sm ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'}`}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Example: Need DSA notes for semester 3, preferably cheap and in good condition..."
                rows="4"
                maxLength={500}
                className={`w-full rounded-xl border px-4 py-3 text-[16px] sm:text-base outline-none transition-all resize-none mb-2 ${
                  darkMode 
                    ? 'bg-slate-700 border-slate-600 text-neutral-200 placeholder-slate-400 focus:border-blue-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
              />
              <p className={`text-xs mb-4 ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`}>
                {input.length}/500 characters
              </p>
              <Button
                onClick={handleSubmit}
                disabled={loading || !input.trim()}
                className="w-full bg-blue-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-blue-700 shadow-[0_0_0_1px_rgba(37,99,235,1)_inset] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full sm:mr-2" />
                    <span className="hidden sm:inline">Posting...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 sm:mr-2" />
                    <span className="hidden sm:inline">Post Need</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 flex flex-col items-center text-center gap-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-red-700 font-medium">{error}</p>
              <Button
                onClick={handleTryAgain}
                className="bg-white border border-red-300 text-red-600 px-5 py-2 rounded-xl hover:bg-red-50 transition-all"
              >
                Try again
              </Button>
            </div>
          )}

          {/* Success Result */}
          {!loading && result && (
            <div className="space-y-8">
              {/* Success Message */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Need Posted Successfully!
                </h2>
                <p className="text-slate-600 mb-4">
                  Sellers with matching items will be notified and can reach out to you.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => navigate('/buyer')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all"
                  >
                    Browse Listings
                  </button>
                  <button
                    onClick={() => {
                      setResult(null);
                      setInput('');
                    }}
                    className="bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Post Another
                  </button>
                </div>
              </div>

              {/* Need Details */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">Your Need</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4">
                    <div className="text-sm text-slate-600 mb-1">Title</div>
                    <div className="text-lg font-bold text-slate-900">{result.need.title}</div>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <div className="text-sm text-slate-600 mb-1">Category</div>
                    <div className="text-lg font-bold text-slate-900">{result.need.category}</div>
                  </div>
                  {result.need.price_range && (
                    <div className="bg-white rounded-xl p-4">
                      <div className="text-sm text-slate-600 mb-1">Budget</div>
                      <div className="text-lg font-bold text-slate-900">
                        ₹{result.need.price_range.min} - ₹{result.need.price_range.max}
                      </div>
                    </div>
                  )}
                  {result.need.tags && result.need.tags.length > 0 && (
                    <div className="bg-white rounded-xl p-4 md:col-span-2">
                      <div className="text-sm text-slate-600 mb-2">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {result.need.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Matched Listings */}
              {result.matched_listings && result.matched_listings.length > 0 && (
                <div>
                  <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Instant Matches ({result.matched_listings.length})
                  </h2>
                  <div className="space-y-4">
                    {result.matched_listings.map((match) => (
                      <div
                        key={match.id}
                        onClick={() => navigate(`/listing/${match.id}`)}
                        className={`rounded-2xl border p-4 flex gap-4 cursor-pointer transition-all hover:shadow-lg ${
                          darkMode 
                            ? 'bg-[#212121] border-neutral-700 hover:border-slate-600' 
                            : 'bg-white border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {match.images && match.images.length > 0 ? (
                          <div className="flex-shrink-0">
                            <img
                              src={match.images[0]}
                              alt={match.title}
                              className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl"
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-slate-200 rounded-xl flex items-center justify-center">
                            <span className="text-neutral-400 text-xs">No image</span>
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className={`text-lg font-bold line-clamp-1 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                              {match.title}
                            </h3>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getScoreBadgeClass(match.match_score)}`}>
                              {match.match_score}% match
                            </span>
                          </div>
                          <div className="text-xl font-black text-blue-600 mb-2">
                            {match.price != null ? `₹${Number(match.price).toLocaleString()}` : '—'}
                          </div>
                          <p className={`text-sm line-clamp-2 ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
                            {match.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostNeedPage;
