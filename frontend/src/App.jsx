import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { QueryProvider } from './lib/react-query'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import { useAuth } from './contexts/AuthContext'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import OTPVerificationPage from './pages/OTPVerificationPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import DashboardHome from './pages/DashboardHome'
import BuyerPage from './pages/BuyerPage'
import ListingDetailPage from './pages/ListingDetailPage'
import SellerPage from './pages/SellerPage'
import PostListingPage from './pages/PostListingPage'
import EditListingPage from './pages/EditListingPage'
import NeedBoardPage from './pages/NeedBoardPage'
import NeedBoardHistoryPage from './pages/NeedBoardHistoryPage'
import PostNeedPage from './pages/PostNeedPage'
import SellerDemandFeedPage from './pages/SellerDemandFeedPage'
import ChatPage from './pages/ChatPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ProfilePage from './pages/ProfilePage'
import EditProfilePage from './pages/EditProfilePage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsConditionsPage from './pages/TermsConditionsPage'
import CommunityGuidelinesPage from './pages/CommunityGuidelinesPage'
import AboutPage from './pages/AboutPage'

// Profile redirect component
function ProfileRedirect() {
  const { currentUser } = useAuth();
  if (currentUser?.uid) {
    return <Navigate to={`/profile/${currentUser.uid}`} replace />;
  }
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/home" element={<LandingPage />} />
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-conditions" element={<TermsConditionsPage />} />
              <Route path="/community-guidelines" element={<CommunityGuidelinesPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/otp-verification" element={<OTPVerificationPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
              <Route path="/buyer" element={<ProtectedRoute><BuyerPage /></ProtectedRoute>} />
              <Route path="/listing/:id" element={<ProtectedRoute><ListingDetailPage /></ProtectedRoute>} />
              <Route path="/seller" element={<ProtectedRoute><SellerPage /></ProtectedRoute>} />
              <Route path="/post-listing" element={<ProtectedRoute><PostListingPage /></ProtectedRoute>} />
              <Route path="/edit-listing/:id" element={<ProtectedRoute><EditListingPage /></ProtectedRoute>} />
              <Route path="/need-board" element={<ProtectedRoute><NeedBoardPage /></ProtectedRoute>} />
              <Route path="/needboard/history" element={<ProtectedRoute><NeedBoardHistoryPage /></ProtectedRoute>} />
              <Route path="/post-need" element={<ProtectedRoute><PostNeedPage /></ProtectedRoute>} />
              <Route path="/seller/demand-feed" element={<ProtectedRoute><SellerDemandFeedPage /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfileRedirect /></ProtectedRoute>} />
              <Route path="/profile/:userId" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/profile/:userId/edit" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  )
}

export default App
