import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ImageCropModal from '../components/ImageCropModal';
import { GraduationCap, Lock, ArrowLeft, Save, Upload, X, AlertCircle, Smartphone } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import imageService from '../services/imageService';

// Rate limiting configuration
const RATE_LIMITS = {
  BRANCH_CHANGES_PER_MONTH: 2,
  PHOTO_CHANGES_PER_MONTH: 3,
};

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser: authUser, userProfile, refreshUserProfile } = useAuth();
  const { darkMode: isDarkMode } = useTheme();

  const displayBranch = userProfile?.branch || 'Not specified';
  const coverGradient = userProfile?.cover_gradient || 'from-blue-600 to-purple-600';
  const avatar = userProfile?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(authUser?.displayName || 'User');

  const [editBranch, setEditBranch] = useState(displayBranch);
  const [editGradient, setEditGradient] = useState(coverGradient);
  const [editAvatar, setEditAvatar] = useState(avatar);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState({
    branchChangesRemaining: RATE_LIMITS.BRANCH_CHANGES_PER_MONTH,
    photoChangesRemaining: RATE_LIMITS.PHOTO_CHANGES_PER_MONTH,
    branchNextReset: null,
    photoNextReset: null,
  });

  const branches = [
    'Computer Engineering',
    'Artificial Intelligence (AI) And Data Science',
    'CSE Artificial Intelligence and Machine Learning',
    'IOT and Cybersecurity Including Blockchain',
    'Electrical Engineering',
    'Mechanical Engineering'
  ];

  const gradientOptions = [
    { name: 'Blue to Purple', value: 'from-blue-600 to-purple-600' },
    { name: 'Pink to Orange', value: 'from-pink-600 to-orange-600' },
    { name: 'Green to Teal', value: 'from-green-600 to-teal-600' },
    { name: 'Indigo to Blue', value: 'from-indigo-600 to-blue-600' },
    { name: 'Red to Pink', value: 'from-red-600 to-pink-600' },
    { name: 'Purple to Pink', value: 'from-purple-600 to-pink-600' },
    { name: 'Cyan to Blue', value: 'from-cyan-600 to-blue-600' },
    { name: 'Amber to Orange', value: 'from-amber-600 to-orange-600' },
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, GIF, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError('');

    // Create preview for cropping
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedFile) => {
    setSelectedFile(croppedFile);
    setShowCropModal(false);
    setImageToCrop(null);

    // Create preview from cropped file
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(croppedFile);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
  };

  // Check rate limits on component mount
  useEffect(() => {
    const checkRateLimits = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../services/firebase');
        
        const userDoc = await getDoc(doc(db, 'users', authUser.uid));
        const userData = userDoc.data();
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Check branch changes
        const branchHistory = userData?.branch_change_history || [];
        const branchChangesThisMonth = branchHistory.filter(change => {
          const changeDate = new Date(change.timestamp);
          return changeDate.getMonth() === currentMonth && changeDate.getFullYear() === currentYear;
        }).length;
        
        // Check photo changes
        const photoHistory = userData?.photo_change_history || [];
        const photoChangesThisMonth = photoHistory.filter(change => {
          const changeDate = new Date(change.timestamp);
          return changeDate.getMonth() === currentMonth && changeDate.getFullYear() === currentYear;
        }).length;
        
        // Calculate next reset date (first day of next month)
        const nextReset = new Date(currentYear, currentMonth + 1, 1);
        
        setRateLimitInfo({
          branchChangesRemaining: Math.max(0, RATE_LIMITS.BRANCH_CHANGES_PER_MONTH - branchChangesThisMonth),
          photoChangesRemaining: Math.max(0, RATE_LIMITS.PHOTO_CHANGES_PER_MONTH - photoChangesThisMonth),
          branchNextReset: nextReset,
          photoNextReset: nextReset,
        });
      } catch (error) {
        console.error('Failed to check rate limits:', error);
      }
    };
    
    if (authUser) {
      checkRateLimits();
    }
  }, [authUser]);

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setError('Please enter your password to confirm changes.');
      return;
    }

    // Check if branch is being changed
    const isBranchChanging = editBranch !== displayBranch;
    const isPhotoChanging = selectedFile !== null || (editAvatar !== avatar);

    // Validate rate limits
    if (isBranchChanging && rateLimitInfo.branchChangesRemaining <= 0) {
      const resetDate = rateLimitInfo.branchNextReset?.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
      setError(`Branch change limit reached. You can change your branch ${RATE_LIMITS.BRANCH_CHANGES_PER_MONTH} times per month. Next reset: ${resetDate}`);
      return;
    }

    if (isPhotoChanging && rateLimitInfo.photoChangesRemaining <= 0) {
      const resetDate = rateLimitInfo.photoNextReset?.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
      setError(`Photo change limit reached. You can change your photo ${RATE_LIMITS.PHOTO_CHANGES_PER_MONTH} times per month. Next reset: ${resetDate}`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Re-authenticate user with password
      const { EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
      const credential = EmailAuthProvider.credential(authUser.email, password);
      await reauthenticateWithCredential(authUser, credential);

      // Upload image if file is selected
      let imageUrl = editAvatar;
      if (selectedFile) {
        console.log('📤 Uploading file to Supabase...');
        setUploadProgress(10);
        imageUrl = await imageService.upload(selectedFile, 'profile');
        setUploadProgress(100);
        console.log('✅ Upload complete! URL:', imageUrl);
      }

      console.log('🔍 Checking avatar update:');
      console.log('  - New imageUrl:', imageUrl);
      console.log('  - Current avatar:', avatar);
      console.log('  - Are they different?', imageUrl !== avatar);

      // Update profile in Firestore
      const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
      const { db } = await import('../services/firebase');
      
      const updates = {};
      const now = new Date().toISOString();
      
      if (editBranch && editBranch !== displayBranch) {
        updates.branch = editBranch;
        updates.branch_change_history = arrayUnion({
          from: displayBranch,
          to: editBranch,
          timestamp: now,
        });
      }
      
      if (editGradient && editGradient !== coverGradient) {
        updates.cover_gradient = editGradient;
      }
      
      if (imageUrl && imageUrl !== avatar) {
        console.log('✅ Adding avatar to updates');
        updates.avatar = imageUrl;
        updates.photo_change_history = arrayUnion({
          timestamp: now,
          url: imageUrl,
        });
      } else {
        console.log('⚠️ Avatar not added to updates');
      }

      console.log('📝 Final updates object:', updates);

      if (Object.keys(updates).length > 0) {
        console.log('💾 Saving to Firestore...');
        await updateDoc(doc(db, 'users', authUser.uid), updates);
        console.log('✅ Firestore update successful!');
        
        // Refresh user profile to get latest data
        await refreshUserProfile();
        console.log('✅ Profile refreshed!');
        
        setSuccess(true);
        setTimeout(() => {
          navigate('/profile');
        }, 1500);
      } else {
        setError('No changes detected.');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError('Incorrect password. Please try again.');
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-[100dvh] ${isDarkMode ? 'bg-[#0f0f0f]' : 'bg-slate-50'}`}>
      <Header />
      
      {/* Image Crop Modal */}
      {showCropModal && imageToCrop && (
        <ImageCropModal
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
      
      <div className="px-6 sm:px-8 md:px-12 lg:px-24 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate('/profile')}
            className={`flex items-center gap-2 ${isDarkMode ? 'text-neutral-400 hover:text-slate-100' : 'text-slate-600 hover:text-slate-900'} mb-6 transition-colors`}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Profile</span>
          </button>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className={`font-['Outfit'] text-3xl font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'} mb-2`}>
              Edit Profile
            </h1>
            <p className={isDarkMode ? 'text-neutral-400' : 'text-slate-600'}>
              Update your profile information. All changes require password confirmation.
            </p>
          </div>

          {/* Rate Limit Info */}
          <div className={`mb-6 ${isDarkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4`}>
            <div className="flex items-start gap-3">
              <AlertCircle className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} mt-0.5 flex-shrink-0`} />
              <div className="flex-1">
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'} mb-2`}>Monthly Change Limits</h3>
                <div className={`space-y-1 text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                  <p>
                    • Branch changes: <span className="font-bold">{rateLimitInfo.branchChangesRemaining}</span> of {RATE_LIMITS.BRANCH_CHANGES_PER_MONTH} remaining
                  </p>
                  <p>
                    • Photo changes: <span className="font-bold">{rateLimitInfo.photoChangesRemaining}</span> of {RATE_LIMITS.PHOTO_CHANGES_PER_MONTH} remaining
                  </p>
                  {rateLimitInfo.branchNextReset && (
                    <p className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-600'} mt-2`}>
                      Resets on: {rateLimitInfo.branchNextReset.toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className={`mb-6 px-4 py-3 rounded-xl ${isDarkMode ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-green-50 border-green-200 text-green-700'} border text-sm`}>
              ✓ Profile updated successfully! Redirecting...
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={`mb-6 px-4 py-3 rounded-xl ${isDarkMode ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-600'} border text-sm`}>
              {error}
            </div>
          )}

          {/* Edit Form */}
          <form onSubmit={handleSaveChanges} className="space-y-6">
            {/* Branch Selection */}
            <div className={`${isDarkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'} rounded-2xl border p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Branch/Department</h2>
                {rateLimitInfo.branchChangesRemaining === 0 && (
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                    Limit Reached
                  </span>
                )}
              </div>
              <div className="relative">
                <GraduationCap className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-slate-500' : 'text-neutral-400'} z-10`} />
                <select
                  value={editBranch}
                  onChange={(e) => setEditBranch(e.target.value)}
                  disabled={rateLimitInfo.branchChangesRemaining === 0}
                  className={`w-full rounded-xl border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-slate-200 text-slate-900'} pl-12 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-500`}
                >
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
                <svg className={`absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-slate-500' : 'text-neutral-400'} pointer-events-none`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {rateLimitInfo.branchChangesRemaining === 0 && (
                <p className="text-xs text-red-600 mt-2">
                  You've reached the monthly limit for branch changes. Try again next month.
                </p>
              )}
            </div>

            {/* Cover Gradient Selection */}
            <div className={`${isDarkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'} rounded-2xl border p-6`}>
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'} mb-4`}>Cover Gradient</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {gradientOptions.map((gradient) => (
                  <button
                    key={gradient.value}
                    type="button"
                    onClick={() => setEditGradient(gradient.value)}
                    className={`h-20 rounded-xl bg-gradient-to-r ${gradient.value} transition-all ${
                      editGradient === gradient.value
                        ? 'ring-4 ring-blue-500 ring-offset-2'
                        : 'hover:ring-2 hover:ring-slate-300'
                    }`}
                    title={gradient.name}
                  >
                    <span className="sr-only">{gradient.name}</span>
                  </button>
                ))}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
                Selected: <span className="font-medium">{gradientOptions.find(g => g.value === editGradient)?.name}</span>
              </p>
            </div>

            {/* Profile Image */}
            <div className={`${isDarkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'} rounded-2xl border p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Profile Image</h2>
                {rateLimitInfo.photoChangesRemaining === 0 && (
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                    Limit Reached
                  </span>
                )}
              </div>
              
              {rateLimitInfo.photoChangesRemaining === 0 && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                  You've reached the monthly limit for photo changes. Try again next month.
                </div>
              )}
              
              {/* File Upload */}
              <div className="mb-4">
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-neutral-300' : 'text-slate-700'} mb-3`}>Upload Image</label>
                
                {!selectedFile && !previewUrl ? (
                  <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed ${isDarkMode ? 'border-slate-600' : 'border-slate-300'} rounded-xl transition-all ${
                    rateLimitInfo.photoChangesRemaining > 0 
                      ? `cursor-pointer ${isDarkMode ? 'hover:border-blue-400 hover:bg-neutral-800' : 'hover:border-blue-500 hover:bg-blue-50'}` 
                      : `cursor-not-allowed opacity-50 ${isDarkMode ? 'bg-[#212121]' : 'bg-slate-50'}`
                  }`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className={`h-10 w-10 ${isDarkMode ? 'text-slate-500' : 'text-neutral-400'} mb-3`} />
                      <p className={`mb-2 text-sm ${isDarkMode ? 'text-neutral-400' : 'text-slate-600'}`}>
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>PNG, JPG, GIF up to 5MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={rateLimitInfo.photoChangesRemaining === 0}
                    />
                  </label>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    {/* Circular Preview */}
                    <div className="relative">
                      <img
                        src={previewUrl || editAvatar}
                        alt="Preview"
                        className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors shadow-lg"
                        title="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Preview Label */}
                    <div className="text-center">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Preview</p>
                      <p className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-slate-500'}`}>This is how your photo will appear</p>
                    </div>
                    
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="w-full max-w-xs">
                        <div className={`w-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'} rounded-full h-2`}>
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-slate-600'} text-center mt-1`}>Uploading... {Math.round(uploadProgress)}%</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Current Profile Picture */}
              {!selectedFile && !previewUrl && (
                <div className={`flex items-center gap-4 p-4 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-50'} rounded-xl`}>
                  <img 
                    src={editAvatar} 
                    alt="Current" 
                    className={`h-20 w-20 rounded-full object-cover border-2 ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`} 
                  />
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>Current Profile Picture</p>
                    <p className={`text-xs ${isDarkMode ? 'text-neutral-400' : 'text-slate-500'}`}>Upload a new image to replace</p>
                  </div>
                </div>
              )}
            </div>

            {/* Password Confirmation */}
            <div className={`${isDarkMode ? 'bg-[#212121] border-neutral-700' : 'bg-white border-slate-200'} rounded-2xl border p-6`}>
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'} mb-4`}>Confirm Changes</h2>
              <p className={`text-sm ${isDarkMode ? 'text-neutral-400' : 'text-slate-600'} mb-4`}>
                Enter your password to save changes to your profile.
              </p>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-slate-500' : 'text-neutral-400'}`} />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full rounded-xl border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-neutral-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'} pl-12 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all`}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                type="button"
                onClick={() => navigate('/profile')}
                variant="outline"
                className="flex-1 rounded-xl"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !password}
                className="flex-1 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;


