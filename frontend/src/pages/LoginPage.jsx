import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Sparkles, Shield, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserCount } from '../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userCount, setUserCount] = useState(0);

  // Fetch user count on mount
  useEffect(() => {
    const fetchUserCount = async () => {
      const count = await getUserCount();
      setUserCount(count);
    };
    fetchUserCount();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setUserNotFound(false);

    if (!email.endsWith('@sigce.edu.in')) {
      setError('Only SIGCE email addresses (@sigce.edu.in) are allowed.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/user-not-found' ||
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/wrong-password') {
        setUserNotFound(true);
      } else {
        setError(getErrorMessage(err.code));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToSignup = () => navigate('/signup', { state: { email, password } });

  const handleForgotPassword = async () => {
    if (!email) { setError('Enter your email above first.'); return; }
    setError('');
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(getErrorMessage(err.code));
    }
  };

  const perks = [
    { icon: Sparkles, text: 'AI-powered buyer-seller matching' },
    { icon: Shield, text: 'Verified trust score system' },
    { icon: Zap, text: 'Instant in-app chat' },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-[#0f0f0f]">

      {/* ===== LEFT PANEL - Branding (Desktop Only) ===== */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-hero overflow-hidden">
        {/* Decorative Orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <Link to="/home" className="relative z-10 flex items-center gap-3">
          <img src="/UNIFIND.png" alt="UNIFIND" className="h-12 w-auto" />
          <span className="font-['Outfit'] font-black text-3xl">
            <span className="text-indigo-400">UNI</span>
            <span className="text-violet-400">FIND</span>
          </span>
        </Link>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h2 className="font-['Outfit'] text-4xl xl:text-5xl font-black text-white mb-4 leading-tight">
            Welcome Back to<br />
            <span className="gradient-text-hero">Campus Commerce</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 leading-relaxed">
            Your trusted student marketplace for buying and selling everything from textbooks to electronics.
          </p>
          <div className="space-y-4">
            {perks.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 glass border border-white/10 rounded-xl px-4 py-3">
                <div className="bg-indigo-500/20 h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-indigo-400" />
                </div>
                <span className="text-slate-300 text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating card at bottom */}
        <div className="relative z-10">
          <div className="glass border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <div className="flex -space-x-1.5">
              {['bg-indigo-500', 'bg-violet-500', 'bg-emerald-500'].map((c, i) => (
                <div key={i} className={`h-7 w-7 ${c} rounded-full border-2 border-slate-800 flex items-center justify-center text-white text-xs font-bold`}>
                  {['A', 'P', 'S'][i]}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white text-xs font-semibold">
                {userCount > 0 ? `${userCount.toLocaleString()} students trading` : 'Join the community'}
              </p>
              <p className="text-slate-500 text-xs">Join the community today</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL - Form ===== */}
      <div className="flex-1 flex flex-col justify-center p-6 sm:p-10 lg:p-14 bg-slate-50 min-h-[100dvh] lg:min-h-0">
        <div className="w-full max-w-md mx-auto">

          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <img src="/UNIFIND.png" alt="UNIFIND" className="h-10 w-auto" />
            <span className="font-['Outfit'] font-black text-2xl">
              <span className="text-indigo-600">UNI</span>
              <span className="text-violet-600">FIND</span>
            </span>
          </div>

          {/* Back to Home Link */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6 group"
          >
            <svg 
              className="w-4 h-4 transition-transform group-hover:-translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>

          <div className="mb-8">
            <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-black text-slate-900 mb-2" data-testid="login-title">
              Welcome Back 👋
            </h1>
            <p className="text-slate-500 text-sm">Sign in to your SIGCE student account</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600" data-testid="login-error">
              {error}
            </div>
          )}
          {userNotFound && (
            <div className="mb-5 px-4 py-4 rounded-xl bg-indigo-50 border border-indigo-200" data-testid="user-not-found">
              <p className="text-sm text-indigo-900 mb-3 font-medium">No account found — want to create one?</p>
              <button
                onClick={handleGoToSignup}
                className="w-full btn-gradient py-2.5 text-sm"
                data-testid="go-to-signup-btn"
              >
                Create New Account
              </button>
            </div>
          )}
          {resetSent && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700" data-testid="reset-sent">
              ✓ Password reset email sent. Check your inbox.
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="email">
                SIGCE Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.name@sigce.edu.in"
                  className="input-premium w-full pl-11 pr-4 py-3 text-sm"
                  required
                  data-testid="login-email-input"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400">Must be a valid @sigce.edu.in address</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-premium w-full pl-11 pr-12 py-3 text-sm"
                  required
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                data-testid="forgot-password-btn"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient py-3.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:animate-none"
              data-testid="login-submit-btn"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-semibold" data-testid="signup-link">
              Sign Up
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-slate-200 flex flex-wrap justify-center gap-4 text-xs text-slate-500">
            <Link to="/privacy-policy" target="_blank" className="hover:text-indigo-600 transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms-conditions" target="_blank" className="hover:text-indigo-600 transition-colors">
              Terms & Conditions
            </Link>
            <span>•</span>
            <a href="mailto:systemrecord07@gmail.com" className="hover:text-indigo-600 transition-colors">
              Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

function getErrorMessage(code) {
  switch (code) {
    case 'auth/user-not-found': return 'No account found with this email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Invalid email or password.';
    case 'auth/too-many-requests': return 'Too many attempts. Try again later.';
    case 'auth/user-disabled': return 'This account has been disabled.';
    case 'auth/invalid-email': return 'Invalid email address.';
    default: return 'Something went wrong. Please try again.';
  }
}

export default LoginPage;

