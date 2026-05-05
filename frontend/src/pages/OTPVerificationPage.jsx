import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import { sendEmailVerification, reload } from 'firebase/auth';
import { auth, actionCodeSettings } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

const OTPVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { syncEmailVerificationStatus } = useAuth();
  const email = location.state?.email || auth.currentUser?.email || 'your email';

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Auto-check verification status every 5 seconds
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!auth.currentUser) return;
      
      try {
        await reload(auth.currentUser);
        if (auth.currentUser.emailVerified) {
          // Sync verification status to database
          await syncEmailVerificationStatus(auth.currentUser);
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Auto-check failed:', err);
      }
    };

    // Check immediately on mount
    checkVerificationStatus();

    // Then check every 5 seconds
    const interval = setInterval(checkVerificationStatus, 5000);

    return () => clearInterval(interval);
  }, [navigate, syncEmailVerificationStatus]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Check if user has verified their email
  const handleCheckVerification = async () => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }
    setChecking(true);
    setError('');
    try {
      // Reload user to get latest emailVerified status from Firebase
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        // Sync verification status to database
        await syncEmailVerificationStatus(auth.currentUser);
        navigate('/dashboard');
      } else {
        setError("Email not verified yet. Check your inbox and click the link, then try again.");
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }
    setResending(true);
    setError('');
    setResendSuccess(false);
    try {
      await sendEmailVerification(auth.currentUser, actionCodeSettings);
      setResendSuccess(true);
      setCountdown(60); // 60s cooldown
    } catch (err) {
      if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Wait a moment before resending.');
      } else {
        setError('Failed to resend. Please try again.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/signup')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
          data-testid="otp-back-btn"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-blue-50 h-16 w-16 rounded-2xl flex items-center justify-center">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2" data-testid="otp-title">
              Verify Your Email
            </h1>
            <p className="text-base text-slate-600">
              We sent a verification link to
            </p>
            <p className="font-semibold text-slate-900 mt-1">{email}</p>
            <p className="text-sm text-slate-500 mt-3">
              Click the link in the email, then press the button below.
            </p>
            <p className="text-xs text-blue-600 mt-2 flex items-center justify-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Auto-checking verification status...
            </p>
            <p className="text-sm text-amber-600 font-medium mt-2">
              ⚠️ Check in spam folder if you don't see the email
            </p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600" data-testid="otp-error">
              {error}
            </div>
          )}
          {resendSuccess && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-600" data-testid="resend-success">
              Verification email resent successfully. Check in spam folder if you don't see it.
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleCheckVerification}
              disabled={checking}
              className="w-full bg-blue-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-blue-700 shadow-[0_0_0_1px_rgba(37,99,235,1)_inset] transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              data-testid="otp-verify-btn"
            >
              {checking ? 'Checking...' : "I've verified my email"}
            </Button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || countdown > 0}
              className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="resend-otp-btn"
            >
              <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
              {countdown > 0 ? `Resend in ${countdown}s` : resending ? 'Sending...' : 'Resend verification email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationPage;

