import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus, Mail, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import LandingPage from '../pages/LandingPage';
import { useState, useEffect } from 'react';
import { reload } from 'firebase/auth';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading, syncEmailVerificationStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(false);

  // Auto-check verification status every 5 seconds if not verified
  useEffect(() => {
    if (!currentUser || currentUser.emailVerified) return;

    const checkVerificationStatus = async () => {
      try {
        await reload(currentUser);
        if (currentUser.emailVerified) {
          await syncEmailVerificationStatus(currentUser);
          window.location.reload(); // Force full page reload to update UI
        }
      } catch (err) {
        console.error('Auto-check failed:', err);
      }
    };

    // Check immediately
    checkVerificationStatus();

    // Then check every 5 seconds
    const interval = setInterval(checkVerificationStatus, 5000);

    return () => clearInterval(interval);
  }, [currentUser, syncEmailVerificationStatus]);

  const handleCheckVerification = async () => {
    if (!currentUser) return;
    setChecking(true);
    try {
      await reload(currentUser);
      if (currentUser.emailVerified) {
        await syncEmailVerificationStatus(currentUser);
        window.location.reload();
      } else {
        alert('Email not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (error) {
      console.error('Failed to check verification:', error);
      alert('Failed to check verification status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication modal if not authenticated
  if (!currentUser) {
    return (
      <div className="relative min-h-[100dvh]">
        {/* Background: Landing page with blur */}
        <div className="absolute inset-0 overflow-hidden" style={{ filter: 'blur(8px)' }}>
          <LandingPage />
        </div>
        
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-slate-900/60"></div>

        {/* Authentication Modal */}
        <div className="relative z-50 min-h-[100dvh] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-50 h-16 w-16 rounded-full flex items-center justify-center">
                <LogIn className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-3">
              Authentication Required
            </h2>
            <p className="text-slate-600 text-center mb-8">
              You need to be logged in to access this page. Please login or create a new account to continue.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate('/login')}
                className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
                data-testid="modal-login-btn"
              >
                <LogIn className="h-4 w-4" />
                Login to Account
              </Button>
              <Button
                onClick={() => navigate('/signup')}
                variant="outline"
                className="w-full rounded-xl flex items-center justify-center gap-2"
                data-testid="modal-signup-btn"
              >
                <UserPlus className="h-4 w-4" />
                Create New Account
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                className="w-full rounded-xl text-slate-600"
                data-testid="modal-back-btn"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if email is verified (allow profile page access even if not verified)
  const isProfilePage = location.pathname === '/profile' || location.pathname.startsWith('/profile/');
  
  if (!currentUser.emailVerified && !isProfilePage) {
    return (
      <div className="relative min-h-[100dvh]">
        {/* Background: Landing page with blur */}
        <div className="absolute inset-0 overflow-hidden" style={{ filter: 'blur(8px)' }}>
          <LandingPage />
        </div>
        
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-slate-900/60"></div>

        {/* Email Verification Modal */}
        <div className="relative z-50 min-h-[100dvh] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="bg-amber-50 h-16 w-16 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-3">
              Email Verification Required
            </h2>
            <p className="text-slate-600 text-center mb-4">
              Please verify your email address to access this page. Check your inbox for the verification link we sent to <span className="font-semibold">{currentUser.email}</span>.
            </p>
            <p className="text-sm text-amber-600 font-medium text-center mb-8">
              ⚠️ Check in spam folder if you don't see the email
            </p>
            <p className="text-xs text-blue-600 text-center mb-4 flex items-center justify-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Auto-checking verification status...
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleCheckVerification}
                disabled={checking}
                className="w-full rounded-xl bg-green-600 text-white hover:bg-green-700"
              >
                {checking ? 'Checking...' : "I've Verified My Email"}
              </Button>
              <Button
                onClick={() => navigate(`/profile/${currentUser.uid}`)}
                className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                data-testid="modal-profile-btn"
              >
                Go to Profile
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full rounded-xl"
                data-testid="modal-home-btn"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render the protected component if authenticated and verified (or on profile page)
  return children;
};

export default ProtectedRoute;

