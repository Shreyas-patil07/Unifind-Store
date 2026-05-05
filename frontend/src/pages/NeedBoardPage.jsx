import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Sparkles, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { searchNeedBoard, getNeedBoardHistory } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const NeedBoardPage = () => {
  const { darkMode } = useTheme();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [searchesRemaining, setSearchesRemaining] = useState(3);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isFetchingData, setIsFetchingData] = useState(false);

  // Fetch remaining searches and history from backend on mount
  React.useEffect(() => {
    if (currentUser && !isFetchingData) {
      fetchSearchData();
    }
  }, [currentUser]);

  const fetchSearchData = async () => {
    if (!currentUser || isFetchingData) return;
    
    setIsFetchingData(true);
    try {
      console.log('Fetching search data from /need-board/history');
      const idToken = await currentUser.getIdToken();
      const data = await getNeedBoardHistory(idToken);
      console.log('Search history response:', data);
      setSearchesRemaining(data.searches_remaining);
      setSearchHistory(Array.isArray(data.searches) ? data.searches : []);
    } catch (err) {
      console.error('Failed to fetch search data:', err);
      // Don't reset to 3 if we already have a value, to avoid flickering
      if (searchesRemaining === 3) {
        setSearchesRemaining(3);
      }
      setSearchHistory([]);
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleSearch = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('Searching for:', input);
      console.log('Current user:', currentUser);
      
      if (!currentUser) {
        setError('You must be logged in to search');
        setLoading(false);
        return;
      }
      
      const idToken = await currentUser.getIdToken();
      console.log('Got ID token:', idToken ? 'Yes' : 'No');
      
      const data = await searchNeedBoard(input, idToken);
      console.log('Search results:', data);
      
      // Results are already filtered on backend (>= 50%, top 10)
      setResults({ 
        extracted: data.extracted, 
        rankedResults: data.rankedResults 
      });
      
      // Update search count from response (more reliable than fetching separately)
      if (typeof data.searches_remaining === 'number') {
        setSearchesRemaining(data.searches_remaining);
      }
      
      // Also refresh history to show the new search
      setTimeout(() => {
        fetchSearchData();
      }, 500);
    } catch (err) {
      console.error('Search error:', err);
      console.error('Error response:', err?.response);
      console.error('Error message:', err?.message);
      
      // Handle rate limiting
      if (err?.response?.status === 429) {
        const detail = err?.response?.data?.detail || 'Please wait before trying again.';
        setError(`⏱️ ${detail}`);
        setSearchesRemaining(0);
        // Refresh the actual count from server
        setTimeout(() => {
          fetchSearchData();
        }, 1000);
      } else if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
        setError('❌ Cannot connect to server. Please check if the backend is running on http://localhost:8000');
      } else if (err?.response?.status === 401) {
        setError('🔒 Authentication failed. Please logout and login again.');
      } else if (err?.response?.status === 404) {
        setError('❌ User profile not found. Please contact support.');
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
    setResults(null);
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 70) return 'bg-green-100 text-green-700';
    if (score >= 40) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <div className={`min-h-[100dvh] pb-20 ${darkMode ? 'bg-[#0f0f0f]' : 'bg-slate-50'}`}>
      <Header hideSearch />

      <div className="px-6 sm:px-8 md:px-12 lg:px-24 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-4 py-2 mb-4">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">AI-Powered Matching</span>
            </div>
            <h1
              className={`font-['Outfit'] text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}
              data-testid="need-board-title"
            >
              What are you looking for?
            </h1>
            <p className={`text-base ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
              Describe what you need, and our AI will find the perfect matches
            </p>
            {/* Search limit indicator */}
            <div className={`mt-3 text-sm font-medium ${searchesRemaining <= 1 ? 'text-orange-600' : darkMode ? 'text-slate-500' : 'text-neutral-400'}`}>
              {searchesRemaining} {searchesRemaining === 1 ? 'search' : 'searches'} remaining (resets every 12 hours)
            </div>
          </div>

          {/* Search History */}
          {Array.isArray(searchHistory) && searchHistory.length > 0 && (
            <div className={`rounded-2xl border p-6 mb-6 ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-semibold ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>
                  Recent Searches (Last 12 Hours)
                </h3>
                <button
                  onClick={() => navigate('/needboard/history')}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                    darkMode 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  View All Results
                </button>
              </div>
              <div className="space-y-2">
                {searchHistory.slice(0, 3).map((search, index) => {
                  const timeAgo = getTimeAgo(search.timestamp * 1000);
                  const resultCount = search.results ? search.results.length : 0;
                  
                  return (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${darkMode ? 'text-neutral-200' : 'text-slate-900'} truncate`}>
                          {search.query}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`}>
                            {timeAgo}
                          </p>
                          {resultCount > 0 && (
                            <>
                              <span className={`text-xs ${darkMode ? 'text-slate-600' : 'text-neutral-300'}`}>•</span>
                              <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`}>
                                {resultCount} {resultCount === 1 ? 'result' : 'results'}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className={`rounded-2xl border p-8 mb-8 shadow-sm ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'}`}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Example: I need a laptop for coding, budget around 70k, good battery life..."
              rows="4"
              maxLength={500}
              className={`w-full rounded-xl border px-4 py-3 text-[16px] sm:text-base outline-none transition-all resize-none mb-2 ${
                darkMode 
                  ? 'bg-slate-700 border-slate-600 text-neutral-200 placeholder-slate-400 focus:border-blue-500'
                  : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              }`}
              data-testid="need-board-input"
            />
            <p className={`text-xs mb-4 ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`}>
              {input.length}/500 characters
            </p>
            <Button
              onClick={handleSearch}
              disabled={loading || !input.trim() || searchesRemaining <= 0}
              className="w-full bg-blue-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-blue-700 shadow-[0_0_0_1px_rgba(37,99,235,1)_inset] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="find-matches-btn"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full sm:mr-2" />
                  <span className="hidden sm:inline">AI analyzing...</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Find Matches</span>
                </>
              )}
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className={`rounded-2xl border p-8 ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'}`} data-testid="loading-state">
              <div className="space-y-4">
                <div className={`h-4 w-3/4 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded animate-pulse`} />
                <div className={`h-4 w-1/2 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded animate-pulse`} />
                <div className={`h-4 w-2/3 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded animate-pulse`} />
              </div>
              <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-neutral-700' : 'border-slate-200'}`}>
                <div className={`h-32 rounded-xl mb-3 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
                <div className={`h-32 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`} />
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div
              className="bg-red-50 border border-red-200 rounded-2xl p-8 flex flex-col items-center text-center gap-4"
              data-testid="error-state"
            >
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-red-700 font-medium">{error}</p>
              <Button
                onClick={handleTryAgain}
                className="bg-white border border-red-300 text-red-600 px-5 py-2 rounded-xl hover:bg-red-50 transition-all"
                data-testid="try-again-btn"
              >
                Try again
              </Button>
            </div>
          )}

          {/* Results */}
          {!loading && results && (
            <div className="space-y-8" data-testid="results-section">
              {/* Extracted Intent */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-200 p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">What we understood</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4" data-testid="extracted-category">
                    <div className="text-sm text-slate-600 mb-1">Category</div>
                    <div className="text-lg font-bold text-slate-900">{results.extracted.category}</div>
                  </div>
                  <div className="bg-white rounded-xl p-4" data-testid="extracted-subject">
                    <div className="text-sm text-slate-600 mb-1">Subject</div>
                    <div className="text-lg font-bold text-slate-900">{results.extracted.subject}</div>
                  </div>
                  <div className="bg-white rounded-xl p-4" data-testid="extracted-semester">
                    <div className="text-sm text-slate-600 mb-1">Semester</div>
                    <div className="text-lg font-bold text-slate-900">{results.extracted.semester}</div>
                  </div>
                  <div className="bg-white rounded-xl p-4" data-testid="extracted-max-price">
                    <div className="text-sm text-slate-600 mb-1">Max Budget</div>
                    <div className="text-lg font-bold text-slate-900">
                      {results.extracted.max_price != null
                        ? `₹${Number(results.extracted.max_price).toLocaleString()}`
                        : 'Not specified'}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4" data-testid="extracted-condition">
                    <div className="text-sm text-slate-600 mb-1">Preferred Condition</div>
                    <div className="text-lg font-bold text-slate-900">{results.extracted.condition}</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 md:col-span-2" data-testid="extracted-intent-summary">
                    <div className="text-sm text-slate-600 mb-1">Summary</div>
                    <div className="text-base font-medium text-slate-900">{results.extracted.intent_summary}</div>
                  </div>
                </div>
              </div>

              {/* Ranked Results */}
              <div>
                <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Top 10 Matches for You
                </h2>
                {!Array.isArray(results.rankedResults) || results.rankedResults.length === 0 ? (
                  <div className={`rounded-2xl border p-8 text-center ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'}`}>
                    <div className="text-4xl mb-3">🔍</div>
                    <p className={`text-lg font-semibold mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>
                      No matches found
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`}>
                      We couldn't find any products matching your criteria. Try adjusting your search.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.rankedResults.map((result) => {
                      console.log('Rendering result:', result);
                      console.log('Result images:', result.images);
                      return (
                      <div
                        key={result.id}
                        onClick={() => navigate(`/listing/${result.id}`)}
                        className={`rounded-2xl border p-4 flex gap-4 cursor-pointer transition-all hover:shadow-lg ${
                          darkMode 
                            ? 'bg-[#212121] border-neutral-700 hover:border-slate-600' 
                            : 'bg-white border-slate-200 hover:border-blue-300'
                        }`}
                        data-testid={`match-${result.id}`}
                      >
                        {/* Product Image */}
                        {result.images && result.images.length > 0 ? (
                          <div className="flex-shrink-0">
                            <img
                              src={result.images[0]}
                              alt={result.title}
                              className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-xl"
                              onError={(e) => console.error('Image load error:', e.target.src)}
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-slate-200 rounded-xl flex items-center justify-center">
                            <span className="text-neutral-400 text-xs">No image</span>
                          </div>
                        )}
                        
                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className={`text-lg font-bold line-clamp-1 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`} data-testid={`match-title-${result.id}`}>
                              {result.title}
                            </h3>
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded-full ${getScoreBadgeClass(result.match_score)}`}
                              data-testid={`match-score-${result.id}`}
                            >
                              {result.match_score}% match
                            </span>
                          </div>
                          <div className="text-xl font-black text-blue-600 mb-2" data-testid={`match-price-${result.id}`}>
                            {result.price != null ? `₹${Number(result.price).toLocaleString()}` : '—'}
                          </div>
                          <p className={`text-sm line-clamp-2 ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`} data-testid={`match-reason-${result.id}`}>
                            {result.reason}
                          </p>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NeedBoardPage;


