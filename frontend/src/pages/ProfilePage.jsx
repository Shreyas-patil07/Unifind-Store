import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import { Shield, Star, Award, Calendar, GraduationCap, LogOut, Mail, CheckCircle, AlertCircle, RefreshCw, Edit2, Lock, MessageCircle, Moon, Sun, Flag, UserPlus, UserMinus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getPublicProfile } from '../services/api';
import { addFriend, removeFriend, checkFriendship, acceptFriendRequest } from '../services/api';

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { logout, currentUser: authUser, userProfile, syncEmailVerificationStatus } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  
  // Determine if viewing own profile or another user's profile
  const isOwnProfile = !userId || userId === authUser?.uid;
  
  // State for viewing other user's profile
  const [viewedProfile, setViewedProfile] = React.useState(null);
  const [loadingProfile, setLoadingProfile] = React.useState(false);
  const [profileError, setProfileError] = React.useState(null);
  const [showReportModal, setShowReportModal] = React.useState(false);
  const [reportReason, setReportReason] = React.useState('');
  const [reportDetails, setReportDetails] = React.useState('');
  const [reportSubmitting, setReportSubmitting] = React.useState(false);
  const [isFriend, setIsFriend] = React.useState(false);
  const [friendLoading, setFriendLoading] = React.useState(false);
  const [friendshipStatus, setFriendshipStatus] = React.useState('none');
  const [showFriendRequestModal, setShowFriendRequestModal] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const [showErrorModal, setShowErrorModal] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  
  // Fetch profile if viewing another user
  React.useEffect(() => {
    if (!isOwnProfile && userId) {
      setLoadingProfile(true);
      setProfileError(null);
      getPublicProfile(userId, false)
        .then(data => {
          setViewedProfile(data);
          setLoadingProfile(false);
        })
        .catch(err => {
          console.error('Failed to load profile:', err);
          setProfileError('Failed to load profile');
          setLoadingProfile(false);
        });
      
      // Check friendship status
      if (authUser?.uid) {
        checkFriendship(authUser.uid, userId)
          .then(data => {
            setFriendshipStatus(data.status)
            setIsFriend(data.status === 'friends')
          })
          .catch(err => console.error('Failed to check friendship:', err));
      }
    }
  }, [userId, isOwnProfile, authUser]);
  
  // Use appropriate profile data
  const profileData = isOwnProfile ? userProfile : viewedProfile;
  
  // Use real user data from userProfile or viewedProfile
  const displayName = isOwnProfile 
    ? (authUser?.displayName || userProfile?.name || 'User')
    : (viewedProfile?.name || 'User');
  const displayEmail = authUser?.email || '';
  const displayCollege = profileData?.college || 'College';
  const displayBranch = profileData?.branch || 'Not specified';
  const memberSince = profileData?.member_since || new Date().getFullYear().toString();
  const trustScore = profileData?.trust_score || 0;
  const itemsSold = profileData?.items_sold || 0;
  const rating = profileData?.rating || 0.0;
  const reviewCount = profileData?.review_count || 0;
  const coverGradient = profileData?.cover_gradient || 'from-blue-600 to-purple-600';
  const avatar = profileData?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName);
  const isVerified = isOwnProfile ? (authUser?.emailVerified || false) : (viewedProfile?.email_verified || false);
  
  // Real reviews from database (empty for now until we fetch from Firestore)
  const userReviews = profileData?.reviews || [];
  
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [resendingEmail, setResendingEmail] = React.useState(false);
  const [resendSuccess, setResendSuccess] = React.useState(false);
  const [showBranchModal, setShowBranchModal] = React.useState(false);
  const [newBranch, setNewBranch] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [branchError, setBranchError] = React.useState('');
  const [branchLoading, setBranchLoading] = React.useState(false);

  // Auto-check verification status every 5 seconds if not verified
  React.useEffect(() => {
    if (!authUser || !isOwnProfile || isVerified) return;

    const checkVerificationStatus = async () => {
      try {
        const { reload } = await import('firebase/auth');
        await reload(authUser);
        if (authUser.emailVerified) {
          // Sync verification status to database
          await syncEmailVerificationStatus(authUser);
          // Force re-render by updating state
          window.location.reload();
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
  }, [authUser, isOwnProfile, isVerified, syncEmailVerificationStatus]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleResendVerification = async () => {
    if (!authUser) return;
    setResendingEmail(true);
    setResendSuccess(false);
    try {
      const { sendEmailVerification } = await import('firebase/auth');
      const { actionCodeSettings } = await import('../services/firebase');
      await sendEmailVerification(authUser, actionCodeSettings);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      if (error.code === 'auth/too-many-requests') {
        alert('Too many requests. Please wait a moment before trying again.');
      } else {
        alert('Failed to send verification email. Please try again.');
      }
    } finally {
      setResendingEmail(false);
    }
  };

  const branches = [
    'Computer Engineering',
    'Artificial Intelligence (AI) And Data Science',
    'CSE Artificial Intelligence and Machine Learning',
    'IOT and Cybersecurity Including Blockchain',
    'Electrical Engineering',
    'Mechanical Engineering'
  ];

  const handleBranchChange = async () => {
    if (!authUser || !newBranch || !password) {
      setBranchError('Please select a branch and enter your password.');
      return;
    }

    setBranchLoading(true);
    setBranchError('');

    try {
      // Re-authenticate user with password
      const { EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
      const credential = EmailAuthProvider.credential(authUser.email, password);
      await reauthenticateWithCredential(authUser, credential);

      // Update branch in Firestore
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      await updateDoc(doc(db, 'users', authUser.uid), {
        branch: newBranch
      });

      // Refresh user profile
      await syncEmailVerificationStatus(authUser);
      window.location.reload();
    } catch (error) {
      console.error('Failed to update branch:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setBranchError('Incorrect password. Please try again.');
      } else {
        setBranchError('Failed to update branch. Please try again.');
      }
    } finally {
      setBranchLoading(false);
    }
  };

  const handleStartChat = () => {
    if (!authUser || !userId) return;
    navigate(`/chat?user=${userId}`);
  };

  const handleReportUser = async () => {
    if (!reportReason) {
      setErrorMessage('Please select a reason for reporting');
      setShowErrorModal(true);
      return;
    }

    setReportSubmitting(true);
    try {
      // TODO: Implement actual report API call
      console.log('Reporting user:', {
        reportedUserId: userId,
        reportedBy: authUser.uid,
        reason: reportReason,
        details: reportDetails,
        timestamp: new Date().toISOString()
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage('Report submitted successfully. Our team will review it shortly.');
      setShowSuccessModal(true);
      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
    } catch (error) {
      console.error('Failed to submit report:', error);
      setErrorMessage('Failed to submit report. Please try again.');
      setShowErrorModal(true);
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleToggleFriend = async () => {
    if (!authUser?.uid || !userId) return;

    setFriendLoading(true);
    try {
      if (friendshipStatus === 'friends') {
        // Remove friend
        await removeFriend(authUser.uid, userId);
        setFriendshipStatus('none');
        setIsFriend(false);
        setSuccessMessage('Friend removed successfully');
        setShowSuccessModal(true);
      } else if (friendshipStatus === 'request_sent') {
        // Cancel request
        await removeFriend(authUser.uid, userId);
        setFriendshipStatus('none');
        setSuccessMessage('Friend request cancelled');
        setShowSuccessModal(true);
      } else if (friendshipStatus === 'request_received') {
        // Accept request
        await acceptFriendRequest(authUser.uid, userId);
        setFriendshipStatus('friends');
        setIsFriend(true);
        setSuccessMessage('Friend request accepted! You are now friends.');
        setShowSuccessModal(true);
      } else {
        // Send friend request
        const result = await addFriend(authUser.uid, userId);
        if (result.status === 'active') {
          setFriendshipStatus('friends');
          setIsFriend(true);
          setSuccessMessage('Friend request accepted! You are now friends.');
          setShowSuccessModal(true);
        } else {
          setFriendshipStatus('request_sent');
          setShowFriendRequestModal(true);
        }
      }
    } catch (error) {
      console.error('Failed to toggle friend:', error);
      setErrorMessage(error.response?.data?.detail || 'Failed to update friend status. Please try again.');
      setShowErrorModal(true);
    } finally {
      setFriendLoading(false);
    }
  };

  // Show loading state
  if (!isOwnProfile && loadingProfile) {
    return (
      <div className={`min-h-[100dvh] ${darkMode ? 'bg-[#0f0f0f]' : 'bg-slate-50'}`}>
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100dvh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className={darkMode ? 'text-neutral-400' : 'text-slate-600'}>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (!isOwnProfile && profileError) {
    return (
      <div className={`min-h-[100dvh] ${darkMode ? 'bg-[#0f0f0f]' : 'bg-slate-50'}`}>
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100dvh-80px)]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{profileError}</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-[100dvh] pb-20 ${darkMode ? 'bg-[#0f0f0f]' : 'bg-slate-50'}`}>
      <Header hideSearch />
      
      <div className="px-6 sm:px-8 md:px-12 lg:px-24 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Dark Mode Toggle - Only for own profile */}
          {isOwnProfile && (
            <div className="flex justify-end mb-4">
              <button
                onClick={toggleDarkMode}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                  darkMode 
                    ? 'bg-[#212121] border border-neutral-700 hover:bg-neutral-800' 
                    : 'bg-white border border-slate-200 hover:bg-slate-50 shadow-sm'
                }`}
              >
                <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  darkMode ? 'bg-indigo-600' : 'bg-slate-300'
                }`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 flex items-center justify-center ${
                    darkMode ? 'translate-x-6' : 'translate-x-0'
                  }`}>
                    {darkMode ? (
                      <Moon className="h-3 w-3 text-indigo-600" />
                    ) : (
                      <Sun className="h-3 w-3 text-amber-500" />
                    )}
                  </div>
                </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-neutral-200' : 'text-slate-700'}`}>
                  {darkMode ? 'Dark Mode' : 'Light Mode'}
                </span>
              </button>
            </div>
          )}
          
          {/* Profile Header */}
          <div className={`rounded-2xl border shadow-sm overflow-hidden mb-8 ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'}`}>
            {/* Cover Image with Edit Button */}
            <div className={`h-32 bg-gradient-to-r ${coverGradient} relative`}>
              {isOwnProfile && authUser && isVerified && (
                <button
                  onClick={() => navigate(`/profile/${authUser.uid}/edit`)}
                  className={`absolute top-4 right-4 px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl ${darkMode ? 'bg-slate-700/90 hover:bg-neutral-800 text-neutral-200' : 'bg-white/90 hover:bg-white text-slate-700'}`}
                  title="Edit Profile"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="text-sm font-medium hidden sm:inline">Edit Profile</span>
                </button>
              )}
              {!isOwnProfile && authUser && (
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={handleToggleFriend}
                    disabled={friendLoading}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl ${
                      friendshipStatus === 'friends'
                        ? 'bg-white/90 hover:bg-white text-slate-700' 
                        : friendshipStatus === 'request_sent'
                        ? 'bg-slate-400 text-white cursor-default'
                        : friendshipStatus === 'request_received'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                    title={
                      friendshipStatus === 'friends' ? 'Remove Friend' :
                      friendshipStatus === 'request_sent' ? 'Request Sent' :
                      friendshipStatus === 'request_received' ? 'Accept Request' :
                      'Add Friend'
                    }
                  >
                    {friendLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                    ) : friendshipStatus === 'friends' ? (
                      <UserMinus className="h-4 w-4" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium hidden sm:inline">
                      {friendshipStatus === 'friends' ? 'Remove Friend' :
                       friendshipStatus === 'request_sent' ? 'Request Sent' :
                       friendshipStatus === 'request_received' ? 'Accept Request' :
                       'Add Friend'}
                    </span>
                  </button>
                  <button
                    onClick={handleStartChat}
                    className="bg-white/90 hover:bg-white text-indigo-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
                    title="Send Message"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm font-medium hidden sm:inline">Message</span>
                  </button>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="bg-white/90 hover:bg-white text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
                    title="Report User"
                  >
                    <Flag className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Profile Content */}
            <div className="px-8 pb-8 relative">
              <div className="flex flex-col items-start gap-6">
                {/* Avatar - positioned to overlap gradient */}
                <img
                  src={avatar}
                  alt={displayName}
                  className="h-32 w-32 rounded-2xl object-cover border-4 border-white shadow-lg flex-shrink-0 -mt-16"
                  data-testid="profile-avatar"
                />
                
                {/* Name and Verified Badge */}
                <div className="w-full -mt-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className={`font-['Outfit'] text-3xl font-bold tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-900'}`} data-testid="profile-name">
                      {displayName}
                    </h1>
                    {isVerified && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-semibold rounded-lg border border-green-200">
                        <CheckCircle className="h-4 w-4" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Info Grid and Logout Button */}
                <div className="w-full flex flex-col md:flex-row gap-6">
                  {/* Professional Info Grid */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-50 p-2 rounded-lg flex-shrink-0">
                        <GraduationCap className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs mb-0.5 ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>College</div>
                        <div className={`font-medium text-sm leading-tight ${darkMode ? 'text-neutral-200' : 'text-slate-900'}`} data-testid="profile-college">{displayCollege}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-50 p-2 rounded-lg flex-shrink-0">
                        <Award className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs mb-0.5 ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>Branch</div>
                        <div className={`font-medium text-sm leading-tight ${darkMode ? 'text-neutral-200' : 'text-slate-900'}`}>
                          <span className="truncate">{displayBranch}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-50 p-2 rounded-lg flex-shrink-0">
                        <Calendar className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs mb-0.5 ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>Member Since</div>
                        <div className={`font-medium text-sm leading-tight ${darkMode ? 'text-neutral-200' : 'text-slate-900'}`}>{memberSince}</div>
                      </div>
                    </div>
                    
                    {isOwnProfile && authUser && isVerified && (
                      <div className="flex items-start gap-3">
                        <div className="bg-green-50 p-2 rounded-lg flex-shrink-0">
                          <Mail className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <div className={`text-xs mb-0.5 ${darkMode ? 'text-neutral-400' : 'text-slate-500'}`}>Email</div>
                          <div className={`font-medium text-sm leading-tight truncate ${darkMode ? 'text-neutral-200' : 'text-slate-900'}`}>{displayEmail}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Logout Button */}
                  {isOwnProfile && (
                    <div className="flex flex-col gap-3">
                      <Button 
                        onClick={() => setShowLogoutModal(true)}
                        variant="outline" 
                        className="rounded-xl text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 flex-shrink-0" 
                        data-testid="logout-btn"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Trust Score - Big and Prominent - Only for verified users */}
            {isVerified && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 p-8 text-center mt-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Shield className="h-6 w-6 text-green-600" />
                  <h2 className="text-lg font-bold text-green-900">Trust Score</h2>
                </div>
                <div className="relative inline-block">
                  <svg className="w-32 h-32" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="8"
                      strokeDasharray={`${(trustScore / 100) * 339} 339`}
                      strokeLinecap="round"
                      transform="rotate(-90 60 60)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-4xl font-black text-green-600" data-testid="profile-trust-score">
                      {trustScore}%
                    </div>
                  </div>
                </div>
                <p className="text-sm text-green-700 mt-3">Trusted Seller</p>
              </div>
            )}

            {/* Email Verification Status - Only for unverified users viewing their own profile */}
            {isOwnProfile && authUser && !isVerified && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-amber-100 h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-amber-900 mb-2">Email Verification Required</h3>
                    <p className="text-sm text-amber-700 mb-4">
                      Your email <span className="font-semibold">{displayEmail}</span> is not verified yet. 
                      Please check your inbox and click the verification link to access all features and view your trust score.
                      <span className="block mt-2 font-medium">⚠️ Check in spam folder if you don't see the email</span>
                    </p>
                    {resendSuccess && (
                      <div className="mb-3 px-4 py-2 rounded-lg bg-green-100 border border-green-200 text-sm text-green-700">
                        ✓ Verification email sent successfully! Check in spam folder if you don't see it.
                      </div>
                    )}
                    <Button
                      onClick={handleResendVerification}
                      disabled={resendingEmail}
                      className="bg-amber-600 text-white hover:bg-amber-700 rounded-xl px-4 py-2 text-sm"
                    >
                      {resendingEmail ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Resend Verification Email
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats Grid - Only for verified users */}
          {isVerified && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`rounded-2xl border p-6 text-center ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'}`} data-testid="profile-stat-sold">
              <Package className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <div className={`text-3xl font-black mb-1 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{itemsSold}</div>
              <div className={`text-sm ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>Items Sold</div>
            </div>
            <div className={`rounded-2xl border p-6 text-center ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'}`} data-testid="profile-stat-rating">
              <Star className="h-8 w-8 text-amber-400 mx-auto mb-3" />
              <div className={`text-3xl font-black mb-1 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{rating.toFixed(1)}</div>
              <div className={`text-sm ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>Average Rating</div>
            </div>
            <div className={`rounded-2xl border p-6 text-center ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'}`} data-testid="profile-stat-reviews">
              <Award className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <div className={`text-3xl font-black mb-1 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{reviewCount}</div>
              <div className={`text-sm ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>Reviews</div>
            </div>
          </div>

          {/* Badges */}
          <div className={`rounded-2xl border p-8 mb-8 ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Achievements</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center" data-testid="badge-verified">
                <div className="bg-blue-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <div className={`text-sm font-medium ${darkMode ? 'text-neutral-300' : 'text-slate-900'}`}>Verified</div>
              </div>
              <div className="text-center" data-testid="badge-trusted">
                <div className="bg-green-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Award className="h-8 w-8 text-green-600" />
                </div>
                <div className={`text-sm font-medium ${darkMode ? 'text-neutral-300' : 'text-slate-900'}`}>Trusted Seller</div>
              </div>
              <div className="text-center" data-testid="badge-star">
                <div className="bg-amber-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Star className="h-8 w-8 text-amber-400" />
                </div>
                <div className={`text-sm font-medium ${darkMode ? 'text-neutral-300' : 'text-slate-900'}`}>Top Rated</div>
              </div>
              <div className="text-center" data-testid="badge-pro">
                <div className="bg-purple-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
                <div className={`text-sm font-medium ${darkMode ? 'text-neutral-300' : 'text-slate-900'}`}>Pro Seller</div>
              </div>
            </div>
          </div>

          {/* Reviews - Only show if there are reviews */}
          {Array.isArray(userReviews) && userReviews.length > 0 && (
            <div className={`rounded-2xl border p-8 ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Recent Reviews</h2>
              <div className="space-y-6">
                {userReviews.map((review, index) => (
                  <div key={index} className={`border-b last:border-0 pb-6 last:pb-0 ${darkMode ? 'border-neutral-700' : 'border-slate-100'}`} data-testid={`review-${index}`}>
                    <div className="flex items-start gap-4">
                      <img
                        src={review.reviewerAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(review.reviewerName || 'User')}
                        alt={review.reviewerName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`text-sm font-bold ${darkMode ? 'text-neutral-200' : 'text-slate-900'}`}>{review.reviewerName}</h3>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                        <p className={`text-sm mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>{review.comment}</p>
                        <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{review.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="logout-modal">
          <div className={`rounded-2xl border p-8 max-w-md w-full mx-4 shadow-2xl ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-center mb-6">
              <div className="bg-red-50 h-16 w-16 rounded-full flex items-center justify-center">
                <LogOut className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h2 className={`text-2xl font-bold text-center mb-3 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Logout Confirmation
            </h2>
            <p className={`text-center mb-8 ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
              Are you sure you want to logout? You'll need to login again to access your account.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowLogoutModal(false)}
                variant="outline"
                className="flex-1 rounded-xl"
                data-testid="cancel-logout-btn"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogout}
                className="flex-1 rounded-xl bg-red-600 text-white hover:bg-red-700"
                data-testid="confirm-logout-btn"
              >
                Yes, Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Branch Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`rounded-2xl border p-8 max-w-md w-full mx-4 shadow-2xl ${darkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-center mb-6">
              <div className="bg-blue-50 h-16 w-16 rounded-full flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h2 className={`text-2xl font-bold text-center mb-3 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Change Branch
            </h2>
            <p className={`text-center mb-6 ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
              Select your new branch and enter your password to confirm.
            </p>

            {branchError && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                {branchError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>Current Branch</label>
                <div className={`px-4 py-3 rounded-xl border ${darkMode ? 'bg-slate-700 border-slate-600 text-neutral-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  {displayBranch}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`} htmlFor="newBranch">New Branch</label>
                <div className="relative">
                  <GraduationCap className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 z-10 ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`} />
                  <select
                    id="newBranch"
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    className={`w-full rounded-xl border pl-12 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none cursor-pointer ${darkMode ? 'bg-slate-700 border-slate-600 text-neutral-200' : 'bg-white border-slate-200 text-slate-900'}`}
                  >
                    <option value="">Select new branch...</option>
                    {branches.map((branch) => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                  <svg className={`absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`} htmlFor="password">Password</label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-slate-500' : 'text-neutral-400'}`} />
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full rounded-xl border pl-12 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-neutral-200 placeholder-neutral-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'}`}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowBranchModal(false);
                  setNewBranch('');
                  setPassword('');
                  setBranchError('');
                }}
                variant="outline"
                className="flex-1 rounded-xl"
                disabled={branchLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBranchChange}
                disabled={branchLoading || !newBranch || !password}
                className="flex-1 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {branchLoading ? 'Updating...' : 'Update Branch'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-xl ${darkMode ? 'bg-[#212121]' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-neutral-700' : 'border-slate-200'}`}>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Report User</h3>
              <p className={`text-sm mt-1 ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
                Help us understand what's wrong
              </p>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>
                  Reason for reporting <span className="text-red-500">*</span>
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-all ${
                    darkMode 
                      ? 'bg-slate-700 border-slate-600 text-neutral-200 focus:border-indigo-500' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
                >
                  <option value="">Select a reason...</option>
                  <option value="spam">Spam or misleading</option>
                  <option value="harassment">Harassment or bullying</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="scam">Scam or fraud</option>
                  <option value="fake">Fake profile</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-neutral-300' : 'text-slate-700'}`}>
                  Additional details (optional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide more context about this report..."
                  rows={4}
                  className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-all resize-none ${
                    darkMode 
                      ? 'bg-slate-700 border-slate-600 text-neutral-200 placeholder-slate-400 focus:border-indigo-500' 
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                  }`}
                />
              </div>
            </div>

            <div className={`px-6 py-4 border-t flex gap-3 ${darkMode ? 'border-neutral-700' : 'border-slate-200'}`}>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setReportDetails('');
                }}
                disabled={reportSubmitting}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  darkMode 
                    ? 'bg-slate-700 hover:bg-neutral-700 text-neutral-200' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleReportUser}
                disabled={reportSubmitting || !reportReason}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Friend Request Sent Modal */}
      {showFriendRequestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-xl ${darkMode ? 'bg-[#212121]' : 'bg-white'}`}>
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Friend Request Sent!
              </h3>
              <p className={`text-sm mb-6 ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
                Your friend request has been sent. You'll be notified when they accept.
              </p>
              <button
                onClick={() => setShowFriendRequestModal(false)}
                className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-xl ${darkMode ? 'bg-[#212121]' : 'bg-white'}`}>
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Success!
              </h3>
              <p className={`text-sm mb-6 ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
                {successMessage}
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-xl ${darkMode ? 'bg-[#212121]' : 'bg-white'}`}>
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Error
              </h3>
              <p className={`text-sm mb-6 ${darkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
                {errorMessage}
              </p>
              <button
                onClick={() => setShowErrorModal(false)}
                className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Package = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

export default ProfilePage;


