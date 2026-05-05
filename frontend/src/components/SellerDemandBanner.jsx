import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Users, ArrowRight } from 'lucide-react';
import { getSellerDemandBanner } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const SellerDemandBanner = () => {
  const { currentUser } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [bannerData, setBannerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBannerData();
  }, [currentUser]);

  const fetchBannerData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const idToken = await currentUser.getIdToken();
      const data = await getSellerDemandBanner(idToken);
      setBannerData(data);
    } catch (err) {
      console.error('Failed to fetch seller demand banner:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`rounded-2xl border p-6 ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'}`}>
        <div className={`h-4 w-3/4 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded animate-pulse mb-3`} />
        <div className={`h-4 w-1/2 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded animate-pulse`} />
      </div>
    );
  }

  if (!bannerData || bannerData.total_relevant_needs === 0) {
    return null;
  }

  return (
    <div
      onClick={() => navigate('/seller/demand-feed')}
      className={`rounded-2xl border p-6 cursor-pointer transition-all hover:shadow-lg ${
        darkMode 
          ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-700/50 hover:border-blue-600' 
          : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 hover:border-blue-400'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className={`h-5 w-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Buyer Demand
            </h3>
          </div>
          <p className={`text-2xl font-black mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            {bannerData.message}
          </p>
          {bannerData.top_categories && bannerData.top_categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {bannerData.top_categories.map((category, index) => (
                <span
                  key={index}
                  className={`text-xs font-medium px-3 py-1 rounded-full ${
                    darkMode 
                      ? 'bg-blue-900/50 text-blue-300' 
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {category}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
          <Users className={`h-6 w-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 text-sm font-medium text-blue-600">
        <span>View all needs</span>
        <ArrowRight className="h-4 w-4" />
      </div>
    </div>
  );
};

export default SellerDemandBanner;
