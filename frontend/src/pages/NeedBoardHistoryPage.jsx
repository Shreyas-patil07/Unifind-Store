import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { History, Sparkles, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { getNeedBoardHistory } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const NeedBoardHistoryPage = () => {
  const { darkMode } = useTheme();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchHistory, setSearchHistory] = useState([]);
  const [expandedSearches, setExpandedSearches] = useState(new Set());

  useEffect(() => {
    fetchSearchHistory();
  }, [currentUser]);

  const fetchSearchHistory = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const idToken = await currentUser.getIdToken();
      const data = await getNeedBoardHistory(idToken);
      setSearchHistory(Array.isArray(data.searches) ? data.searches : []);
    } catch (err) {
      console.error('Failed to fetch search history:', err);
      setSearchHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (index) => {
    const newExpanded = new Set(expandedSearches);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSearches(newExpanded);
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

  const getScoreBadgeClass = (score) => {
    if (score >= 70) return 'bg-green-100 text-green-700';
    if (score >= 40) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className={`min-h-[100dvh] pb-20 ${darkMode ? 'bg-[#0f0f0f]' : 'bg-slate-50'}`}>
      <Header hideSearch />

      <div className="px-6 sm:px-8 md:px-12 lg:px-24 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <History className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h1 className={`font-['Outfit'] text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Search History
              </h1>
            </div>
            <p className={`text-base ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
              View your past NeedBoard AI searches and results (last 12 hours)
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
          {!loading && searchHistory.length === 0 && (
            <div className={`rounded-2xl border p-12 text-center ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'}`}>
              <History className={`h-16 w-16 mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-neutral-300'}`} />
              <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>
                No search history yet
              </h2>
              <p className={`text-sm mb-6 ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`}>
                Your NeedBoard AI searches will appear here
              </p>
              <button
                onClick={() => navigate('/needboard')}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all"
              >
                Start Searching
              </button>
            </div>
          )}

          {/* Search History List */}
          {!loading && Array.isArray(searchHistory) && searchHistory.length > 0 && (
            <div className="space-y-6">
              {searchHistory.map((search, index) => {
                const isExpanded = expandedSearches.has(index);
                const timeAgo = getTimeAgo(search.timestamp * 1000);
                const hasResults = search.results && search.results.length > 0;

                return (
                  <div
                    key={index}
                    className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'}`}
                  >
                    {/* Search Header */}
                    <div
                      className={`p-6 cursor-pointer transition-colors ${
                        darkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => toggleExpand(index)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className={`h-4 w-4 flex-shrink-0 ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`} />
                            <span className={`text-sm ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`}>
                              {timeAgo}
                            </span>
                          </div>
                          <p className={`text-lg font-semibold mb-2 ${darkMode ? 'text-neutral-200' : 'text-slate-900'}`}>
                            {search.query}
                          </p>
                          {hasResults && (
                            <p className={`text-sm ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
                              {search.results.length} {search.results.length === 1 ? 'result' : 'results'} found
                            </p>
                          )}
                        </div>
                        <button className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-neutral-800' : 'hover:bg-slate-100'}`}>
                          {isExpanded ? (
                            <ChevronUp className={`h-5 w-5 ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`} />
                          ) : (
                            <ChevronDown className={`h-5 w-5 ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className={`border-t p-6 ${darkMode ? 'border-neutral-700' : 'border-slate-200'}`}>
                        {/* Extracted Intent */}
                        {search.extracted && (
                          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6 mb-6">
                            <div className="flex items-center gap-2 mb-4">
                              <Sparkles className="h-5 w-5 text-blue-600" />
                              <h3 className="text-lg font-bold text-slate-900">What we understood</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="bg-white rounded-lg p-3">
                                <div className="text-xs text-slate-600 mb-1">Category</div>
                                <div className="text-sm font-bold text-slate-900">{search.extracted.category}</div>
                              </div>
                              <div className="bg-white rounded-lg p-3">
                                <div className="text-xs text-slate-600 mb-1">Subject</div>
                                <div className="text-sm font-bold text-slate-900">{search.extracted.subject}</div>
                              </div>
                              <div className="bg-white rounded-lg p-3">
                                <div className="text-xs text-slate-600 mb-1">Semester</div>
                                <div className="text-sm font-bold text-slate-900">{search.extracted.semester}</div>
                              </div>
                              <div className="bg-white rounded-lg p-3">
                                <div className="text-xs text-slate-600 mb-1">Max Budget</div>
                                <div className="text-sm font-bold text-slate-900">
                                  {search.extracted.max_price != null
                                    ? `₹${Number(search.extracted.max_price).toLocaleString()}`
                                    : 'Not specified'}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Results */}
                        {hasResults ? (
                          <div>
                            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                              Ranked Results
                            </h3>
                            <div className="space-y-3">
                              {(Array.isArray(search.results) ? search.results : []).map((result) => (
                                <div
                                  key={result.id}
                                  onClick={() => navigate(`/listing/${result.id}`)}
                                  className={`rounded-xl border p-4 flex gap-4 cursor-pointer transition-all hover:shadow-lg ${
                                    darkMode
                                      ? 'bg-slate-750 border-slate-600 hover:border-slate-500'
                                      : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                                  }`}
                                >
                                  {/* Product Image */}
                                  {result.images && result.images.length > 0 ? (
                                    <div className="flex-shrink-0">
                                      <img
                                        src={result.images[0]}
                                        alt={result.title}
                                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-slate-200 rounded-lg flex items-center justify-center">
                                      <span className="text-neutral-400 text-xs">No image</span>
                                    </div>
                                  )}

                                  {/* Product Details */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                      <h4 className={`text-base font-bold line-clamp-1 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                        {result.title}
                                      </h4>
                                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getScoreBadgeClass(result.match_score)}`}>
                                        {result.match_score}% match
                                      </span>
                                    </div>
                                    <div className="text-lg font-black text-blue-600 mb-1">
                                      {result.price != null ? `₹${Number(result.price).toLocaleString()}` : '—'}
                                    </div>
                                    <p className={`text-sm line-clamp-2 ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
                                      {result.reason}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className={`text-center py-8 ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`}>
                            No results found for this search
                          </div>
                        )}
                      </div>
                    )}
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

export default NeedBoardHistoryPage;

