import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, User, GraduationCap, Eye, EyeOff, Calendar, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import { auth, actionCodeSettings, db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getUserCount } from '../services/api';

const SignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup } = useAuth();

  const prefilledEmail = location.state?.email || '';
  const prefilledPassword = location.state?.password || '';

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    surname: '',
    email: prefilledEmail,
    college: '',
    branch: '',
    yearOfAdmission: '',
    password: prefilledPassword
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userCount, setUserCount] = useState(0);

  // Fetch user count on mount
  useEffect(() => {
    const fetchUserCount = async () => {
      const count = await getUserCount();
      setUserCount(count);
    };
    fetchUserCount();
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [collegeSearch, setCollegeSearch] = useState('');
  const [collegeSelected, setCollegeSelected] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const colleges = ['Smt. Indira Gandhi College of Engineering (SIGCE)', 'Other'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const filteredColleges = colleges.filter(c => c.toLowerCase().includes(collegeSearch.toLowerCase()));

  const handleCollegeSelect = (college) => {
    setFormData({ ...formData, college });
    setCollegeSearch(college);
    setShowCollegeDropdown(false);
    setCollegeSelected(true);
  };

  const handleCollegeClear = () => {
    setFormData({ ...formData, college: '' });
    setCollegeSearch('');
    setCollegeSelected(false);
    setShowCollegeDropdown(true);
  };

  const handleNextStep = async (e) => {
    e.preventDefault();
    setError('');

    // Validate Step 1
    if (currentStep === 1) {
      if (!formData.firstName.trim()) {
        setError('Please enter your first name.');
        return;
      }
      if (!formData.surname.trim()) {
        setError('Please enter your surname.');
        return;
      }
      if (!formData.email.endsWith('@sigce.edu.in')) {
        setError('Only SIGCE email addresses (@sigce.edu.in) are allowed.');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      
      // Check if user already exists in Firestore
      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', formData.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setError('An account with this email already exists. Please login instead.');
          setLoading(false);
          return;
        }
        
        // User doesn't exist, proceed to step 2
        setCurrentStep(2);
      } catch (err) {
        console.error('Error checking email:', err);
        setError('Failed to verify email. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  const handlePreviousStep = () => {
    setError('');
    setCurrentStep(1);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!agreedToTerms) {
      setError('You must agree to the Terms & Conditions and Privacy Policy to continue.');
      return;
    }
    if (!collegeSelected || !formData.college) {
      setError('Please select a college from the dropdown list.');
      return;
    }
    if (!formData.yearOfAdmission) {
      setError('Please select your year of admission.');
      return;
    }
    if (!formData.branch.trim()) {
      setError('Please enter your branch/department.');
      return;
    }

    setLoading(true);
    try {
      // Combine names into full name
      const fullName = `${formData.firstName} ${formData.middleName} ${formData.surname}`.replace(/\s+/g, ' ').trim();
      
      await signup(formData.email, formData.password, fullName, formData.college, formData.branch, formData.yearOfAdmission);
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser, actionCodeSettings);
      }
      navigate('/otp-verification', { state: { email: formData.email } });
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const field = (key) => ({
    value: formData[key],
    onChange: (e) => setFormData({ ...formData, [key]: e.target.value }),
  });

  const benefits = [
    'Buy & sell with verified students only',
    'AI-powered listing matches',
    'Trust score system for safety',
    'Instant in-app chat with sellers',
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-[#0f0f0f]">

      {/* ===== LEFT PANEL - Branding ===== */}
      <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-12 bg-gradient-hero overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        <Link to="/home" className="relative z-10 flex items-center gap-3" data-testid="signup-logo">
          <img src="/UNIFIND.png" alt="UNIFIND" className="h-12 w-auto" />
          <span className="font-['Outfit'] font-black text-3xl">
            <span className="text-indigo-400">UNI</span>
            <span className="text-violet-400">FIND</span>
          </span>
        </Link>

        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h2 className="font-['Outfit'] text-4xl font-black text-white mb-4 leading-tight">
            Join the<br />
            <span className="gradient-text-hero">Student Marketplace</span>
          </h2>
          <p className="text-slate-400 text-base mb-8 leading-relaxed">
            Connect with thousands of verified SIGCE students. Buy, sell, and trade safely on campus.
          </p>
          <div className="space-y-3">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm">{b}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 glass border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
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
              <p className="text-slate-500 text-xs">Be part of the community</p>
            </div>
          </div>
          <p className="text-slate-300 text-xs border-t border-white/10 pt-3">🎓 Exclusive to SIGCE — Smt. Indira Gandhi College of Engineering, Navi Mumbai</p>
        </div>
      </div>

      {/* ===== RIGHT PANEL - Form ===== */}
      <div className="flex-1 flex flex-col justify-center overflow-y-auto bg-slate-50">
        <div className="w-full max-w-lg mx-auto px-5 sm:px-8 py-10">

          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
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

          <div className="mb-7">
            <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-black text-slate-900 mb-1.5" data-testid="signup-title">
              Create Account
            </h1>
            <p className="text-slate-500 text-sm">
              {currentStep === 1 ? 'Step 1 of 2: Basic Information' : 'Step 2 of 2: Academic Details'}
            </p>
            {/* Progress Bar */}
            <div className="mt-4 flex gap-2">
              <div className={`h-1.5 flex-1 rounded-full transition-all ${currentStep >= 1 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-all ${currentStep >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
            </div>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600" data-testid="signup-error">
              {error}
            </div>
          )}

          {/* STEP 1: Basic Information */}
          {currentStep === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              {/* Name Fields - First, Middle, Surname */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="firstName" type="text" placeholder="Arjun" required
                      maxLength={50}
                      pattern="[A-Za-z\s]+"
                      title="Only letters and spaces allowed"
                      className="input-premium w-full pl-11 pr-4 py-3 text-sm"
                      data-testid="signup-firstname-input" {...field('firstName')}
                    />
                  </div>
                </div>

                {/* Middle Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="middleName">
                    Middle Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="middleName" type="text" placeholder="Kumar"
                      maxLength={50}
                      pattern="[A-Za-z\s]*"
                      title="Only letters and spaces allowed"
                      className="input-premium w-full pl-11 pr-4 py-3 text-sm"
                      data-testid="signup-middlename-input" {...field('middleName')}
                    />
                  </div>
                </div>

                {/* Surname */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="surname">
                    Surname <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="surname" type="text" placeholder="Sharma" required
                      maxLength={50}
                      pattern="[A-Za-z\s]+"
                      title="Only letters and spaces allowed"
                      className="input-premium w-full pl-11 pr-4 py-3 text-sm"
                      data-testid="signup-surname-input" {...field('surname')}
                    />
                  </div>
                </div>
              </div>

              {/* SIGCE Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="email">
                  SIGCE Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="email" type="email" placeholder="your.name@sigce.edu.in" required
                    className="input-premium w-full pl-11 pr-4 py-3 text-sm"
                    data-testid="signup-email-input" {...field('email')}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">Must be a valid @sigce.edu.in address</p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="password">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="password" type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters" required minLength={6}
                    className="input-premium w-full pl-11 pr-12 py-3 text-sm"
                    data-testid="signup-password-input" {...field('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    data-testid="toggle-password-visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Next Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gradient py-3.5 text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                data-testid="signup-next-btn"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verifying...
                  </span>
                ) : 'Next: Academic Details'}
              </button>
            </form>
          )}

          {/* STEP 2: Academic Details */}
          {currentStep === 2 && (
            <form onSubmit={handleSignup} className="space-y-4">

            {/* College */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="college">College/University</label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                <input
                  id="college"
                  type="text"
                  placeholder={collegeSelected ? '' : 'Search your college...'}
                  required
                  value={collegeSearch}
                  onChange={(e) => {
                    if (!collegeSelected) {
                      setCollegeSearch(e.target.value);
                      setFormData({ ...formData, college: '' });
                      setShowCollegeDropdown(true);
                    }
                  }}
                  onFocus={() => { if (!collegeSelected) setShowCollegeDropdown(true); }}
                  readOnly={collegeSelected}
                  className={`input-premium w-full pl-11 ${collegeSelected ? 'pr-11' : 'pr-4'} py-3 text-sm ${collegeSelected ? 'bg-slate-50 cursor-default' : ''}`}
                  data-testid="signup-college-input"
                  autoComplete="off"
                />
                {collegeSelected && (
                  <button
                    type="button"
                    onClick={handleCollegeClear}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    data-testid="clear-college-btn"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {showCollegeDropdown && !collegeSelected && filteredColleges.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-card max-h-48 overflow-y-auto">
                    {filteredColleges.map((college, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleCollegeSelect(college)}
                        className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors text-sm text-slate-700 border-b border-slate-100 last:border-b-0"
                        data-testid={`college-option-${idx}`}
                      >
                        {college}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Year & Branch side by side on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Year of Admission */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="yearOfAdmission">Year of Admission</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                  <select
                    id="yearOfAdmission" required
                    value={formData.yearOfAdmission}
                    onChange={(e) => setFormData({ ...formData, yearOfAdmission: e.target.value })}
                    className="input-premium w-full pl-11 pr-4 py-3 text-sm appearance-none cursor-pointer"
                    data-testid="signup-year-input"
                  >
                    <option value="" disabled>Select year...</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <svg className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="branch">Branch/Department</label>
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                  <select
                    id="branch" required
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="input-premium w-full pl-11 pr-4 py-3 text-sm appearance-none cursor-pointer"
                    data-testid="signup-branch-input"
                  >
                    <option value="" disabled>Select branch...</option>
                    <option value="Computer Engineering">Computer Engineering</option>
                    <option value="Artificial Intelligence (AI) And Data Science">AI & Data Science</option>
                    <option value="CSE Artificial Intelligence and Machine Learning">CSE AI & ML</option>
                    <option value="IOT and Cybersecurity Including Blockchain">IOT & Cybersecurity</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
                  <svg className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="password" type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters" required minLength={6}
                  className="input-premium w-full pl-11 pr-12 py-3 text-sm"
                  data-testid="signup-password-input" {...field('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="flex items-start gap-3 p-4 bg-slate-100 rounded-xl">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                data-testid="terms-checkbox"
              />
              <label htmlFor="terms" className="text-sm text-slate-700 leading-relaxed">
                I agree to the{' '}
                <Link to="/terms-conditions" target="_blank" className="text-indigo-600 hover:text-indigo-700 font-semibold underline">
                  Terms & Conditions
                </Link>
                {' '}and{' '}
                <Link to="/privacy-policy" target="_blank" className="text-indigo-600 hover:text-indigo-700 font-semibold underline">
                  Privacy Policy
                </Link>
                . I understand that UNIFIND is a marketplace platform connecting buyers and sellers, and is not responsible for transactions between users.
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePreviousStep}
                className="flex-1 py-3.5 text-sm rounded-xl font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                data-testid="signup-back-btn"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || !collegeSelected || !agreedToTerms}
                className="flex-1 btn-gradient py-3.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:animate-none"
                data-testid="signup-submit-btn"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold" data-testid="login-link">
              Sign In
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
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/invalid-email': return 'Invalid email address.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests': return 'Too many attempts. Try again later.';
    default: return 'Something went wrong. Please try again.';
  }
}

export default SignupPage;

