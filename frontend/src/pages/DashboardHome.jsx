import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { ShoppingBag, Package, MessageCircle, BarChart3, Sparkles, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getProducts, getUserChats } from '../services/api';

const DashboardHome = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, getIdToken } = useAuth();
  const { darkMode } = useTheme();
  const [products, setProducts] = useState([]);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const displayName = currentUser?.displayName || userProfile?.name || 'Student';
  const firstName = displayName.split(' ')[0];
  const trustScore = userProfile?.trust_score || 0;
  const itemsBought = userProfile?.items_bought || 0;
  const itemsSold = userProfile?.items_sold || 0;
  const rating = userProfile?.rating || 0.0;

  // Load user data
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;

      try {
        const token = await getIdToken();
        const [userProducts, userChats] = await Promise.all([
          getProducts({ seller_id: currentUser.uid }),
          getUserChats(currentUser.uid, false, token)
        ]);
        
        setProducts(Array.isArray(userProducts) ? userProducts : []);
        setChats(Array.isArray(userChats) ? userChats : []);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setProducts([]);
        setChats([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser, getIdToken]);

  // Calculate stats from real data
  const userStats = {
    bought: itemsBought,
    sold: itemsSold,
    rating: rating,
    earnings: 0, // TODO: Calculate from transactions
    savings: 0, // TODO: Calculate from transactions
    trustScore: trustScore
  };

  // Generate recent activity from products and chats
  const recentActivity = [
    ...(Array.isArray(products) ? products.slice(0, 2).map(p => ({
      id: `product-${p.id}`,
      type: 'sale',
      title: `Listed ${p.title}`,
      amount: p.price,
      date: p.posted_date || 'Recently'
    })) : []),
    ...(Array.isArray(chats) ? chats.slice(0, 1).map(c => ({
      id: `chat-${c.id}`,
      type: 'message',
      title: 'New message',
      date: c.last_message_time || 'Recently'
    })) : [])
  ].slice(0, 3);

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Recently') return 'Recently';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const navCards = [
    {
      icon: ShoppingBag,
      title: 'Browse & Buy',
      description: 'Explore listings',
      path: '/buyer',
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      testId: 'nav-card-buyer',
    },
    {
      icon: Package,
      title: 'My Listings',
      description: 'Manage your items',
      path: '/seller',
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      testId: 'nav-card-seller',
    },
    {
      icon: Sparkles,
      title: 'NeedBoard AI',
      description: 'AI-powered matching',
      path: '/need-board',
      gradient: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      testId: 'nav-card-need-board',
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Track your stats',
      path: '/analytics',
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      testId: 'nav-card-analytics',
    },
    {
      icon: MessageCircle,
      title: 'Chats',
      description: 'Your conversations',
      path: '/chat',
      gradient: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-50',
      iconColor: 'text-pink-600',
      testId: 'nav-card-chat',
    },
  ];

  const timeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className={`min-h-[100dvh] ${darkMode ? 'bg-[#0f0f0f]' : 'bg-slate-50'}`}>
      <Header hideSearch />

      <div className="px-4 sm:px-6 md:px-10 lg:px-20 py-8 with-bottom-nav">

        {/* ===== WELCOME BANNER ===== */}
        <div className="relative overflow-hidden bg-gradient-hero rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-8">
          {/* Decorative orbs */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-violet-500/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-indigo-300 text-sm font-medium mb-1">{timeOfDay()},</p>
              <h1
                className="font-['Outfit'] text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2"
                data-testid="dashboard-welcome-title"
              >
                {firstName}! 👋
              </h1>
              <p className="text-slate-400 text-sm">Your campus marketplace dashboard</p>
            </div>

            {currentUser?.emailVerified && (
              <div className="inline-flex items-center gap-3 glass border border-white/20 rounded-xl px-5 py-3 self-start sm:self-center">
                <div>
                  <p className="text-slate-400 text-xs">Trust Score</p>
                  <p className="text-2xl font-black text-white" data-testid="dashboard-trust-score">
                    {trustScore}%
                  </p>
                </div>
                <div className="relative h-12 w-12">
                  <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke="url(#trustGrad)" strokeWidth="3"
                      strokeDasharray={`${trustScore} ${100 - trustScore}`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="trustGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#a78bfa" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <TrendingUp className="absolute inset-0 m-auto h-5 w-5 text-indigo-400" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== QUICK STATS ===== */}
        <div className="mb-8">
          <h2 className={`text-base font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-neutral-100' : 'text-slate-700'}`}>
            <span className="h-4 w-1 bg-indigo-600 rounded-full inline-block" />
            Quick Stats
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: 'Items Bought', value: itemsBought, color: 'text-blue-600', bg: 'bg-blue-50', testId: 'stat-bought' },
              { label: 'Items Sold', value: itemsSold, color: 'text-emerald-600', bg: 'bg-emerald-50', testId: 'stat-sold' },
              { label: 'Rating', value: `${rating.toFixed(1)}⭐`, color: 'text-amber-600', bg: 'bg-amber-50', testId: 'stat-rating' },
            ].map(({ label, value, color, bg, testId }) => (
              <div key={label} className={`rounded-2xl border p-4 text-center ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200 shadow-sm'}`} data-testid={testId}>
                <div className={`text-xl sm:text-2xl font-black ${color} mb-0.5`}>{value}</div>
                <div className={`text-xs ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== QUICK ACCESS GRID ===== */}
        <div className="mb-8">
          <h2 className={`text-base font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-neutral-100' : 'text-slate-700'}`}>
            <span className="h-4 w-1 bg-indigo-600 rounded-full inline-block" />
            Quick Access
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {navCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  onClick={() => navigate(card.path)}
                  className={`rounded-2xl border p-4 cursor-pointer text-center group ${darkMode ? 'bg-[#212121] border-neutral-700 hover:border-indigo-500' : 'bg-white border-slate-200 shadow-sm hover:shadow-card-hover'}`}
                  data-testid={card.testId}
                >
                  <div className={`${card.bg} h-11 w-11 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  <h3 className={`text-sm font-bold mb-0.5 hidden sm:block ${darkMode ? 'text-neutral-200' : 'text-slate-900'}`}>{card.title}</h3>
                  <p className={`text-xs hidden sm:block ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>{card.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== RECENT ACTIVITY ===== */}
        <div>
          <h2 className={`text-base font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-neutral-100' : 'text-slate-700'}`}>
            <span className="h-4 w-1 bg-indigo-600 rounded-full inline-block" />
            Recent Activity
          </h2>
          <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`flex items-center justify-between px-4 sm:px-5 py-4 transition-colors ${
                    darkMode ? 'hover:bg-neutral-800/50' : 'hover:bg-slate-50'
                  } ${
                    index !== recentActivity.length - 1 ? (darkMode ? 'border-b border-neutral-700' : 'border-b border-slate-100') : ''
                  }`}
                  data-testid={`activity-item-${activity.id}`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className={`h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center ${
                      activity.type === 'purchase' ? 'bg-blue-50' :
                      activity.type === 'sale' ? 'bg-emerald-50' : 
                      activity.type === 'message' ? 'bg-pink-50' : 'bg-amber-50'
                    }`}>
                      {activity.type === 'purchase' && <ShoppingBag className="h-5 w-5 text-blue-600" />}
                      {activity.type === 'sale' && <Package className="h-5 w-5 text-emerald-600" />}
                      {activity.type === 'message' && <MessageCircle className="h-5 w-5 text-pink-600" />}
                      {activity.type === 'review' && <TrendingUp className="h-5 w-5 text-amber-600" />}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-sm font-medium truncate ${darkMode ? 'text-neutral-200' : 'text-slate-900'}`}>{activity.title}</div>
                      <div className={`text-xs flex items-center gap-1 mt-0.5 ${darkMode ? 'text-neutral-500' : 'text-slate-400'}`}>
                        <Clock className="h-3 w-3" />
                        {formatDate(activity.date)}
                      </div>
                    </div>
                  </div>
                  {activity.amount && (
                    <div className={`text-base font-bold flex-shrink-0 ml-2 ${darkMode ? 'text-neutral-200' : 'text-slate-900'}`}>
                      ₹{activity.amount.toLocaleString()}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Clock className={`h-12 w-12 mx-auto mb-3 ${darkMode ? 'text-neutral-600' : 'text-slate-300'}`} />
                <p className={`text-sm font-medium ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>No recent activity</p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-neutral-500' : 'text-slate-500'}`}>Start buying or selling to see your activity here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;

