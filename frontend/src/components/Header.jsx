import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, ShoppingBag, MessageCircle, User, Menu, X, LayoutDashboard, Sparkles, Package, UserPlus, Bell, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { searchUsers, getPendingFriendRequests, acceptFriendRequest, rejectFriendRequest, getFriends } from '../services/api'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'

export default function Header({ hideSearch = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, getIdToken } = useAuth()
  const { darkMode } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [friendRequests, setFriendRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [showFriends, setShowFriends] = useState(false)
  const [friends, setFriends] = useState([])
  const [friendsLoading, setFriendsLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const searchRef = useRef(null)

  // Load Manrope font for landing page style
  useEffect(() => {
    if (!document.getElementById('uf-header-fonts')) {
      const link = document.createElement('link');
      link.id = 'uf-header-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800;900&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Fetch unread message count with Firestore realtime listener (NO POLLING)
  useEffect(() => {
    if (!currentUser?.uid) return;

    console.log('[Header] Setting up realtime unread count listener for user:', currentUser.uid);

    let isActive = true;
    const unsubscribers = [];

    // Listen to chat_rooms where user is user1
    const q1 = query(
      collection(db, 'chat_rooms'),
      where('user1_id', '==', currentUser.uid)
    );

    // Listen to chat_rooms where user is user2
    const q2 = query(
      collection(db, 'chat_rooms'),
      where('user2_id', '==', currentUser.uid)
    );

    const calculateUnreadCount = (chats) => {
      const totalUnread = chats.reduce((sum, chat) => {
        const count = chat.user1_id === currentUser.uid 
          ? chat.unread_count_user1 
          : chat.unread_count_user2;
        return sum + (count || 0);
      }, 0);
      
      console.log('[Header] Unread count updated:', totalUnread);
      setUnreadCount(totalUnread);
    };

    const chatCache = new Map();

    // Listener for chats where user is user1
    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      if (!isActive) return;
      
      snapshot.docs.forEach(doc => {
        chatCache.set(doc.id, { id: doc.id, ...doc.data() });
      });
      
      calculateUnreadCount(Array.from(chatCache.values()));
    }, (error) => {
      console.error('[Header] Error in user1 listener:', error);
    });

    // Listener for chats where user is user2
    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      if (!isActive) return;
      
      snapshot.docs.forEach(doc => {
        chatCache.set(doc.id, { id: doc.id, ...doc.data() });
      });
      
      calculateUnreadCount(Array.from(chatCache.values()));
    }, (error) => {
      console.error('[Header] Error in user2 listener:', error);
    });

    unsubscribers.push(unsubscribe1, unsubscribe2);

    return () => {
      isActive = false;
      unsubscribers.forEach(unsub => unsub());
      console.log('[Header] Cleaned up realtime listeners');
    };
  }, [currentUser?.uid]);

  const handleProfileClick = () => {
    if (currentUser?.uid) {
      navigate(`/profile/${currentUser.uid}`)
    } else {
      navigate('/profile')
    }
    setMobileMenuOpen(false)
  }

  // Handle user search
  const handleSearch = async (query) => {
    setSearchQuery(query)
    
    if (query.trim().length < 2) {
      setSearchResults([])
      // Don't close the dropdown, just clear results
      return
    }

    setSearchLoading(true)
    try {
      const results = await searchUsers(query.trim())
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking on the button itself (handled by button onClick)
      if (
        event.target.closest('[data-testid="mobile-find-users-btn"]') ||
        event.target.closest('[data-testid="mobile-find-users-btn-chat"]') ||
        event.target.closest('[data-testid="desktop-find-users-btn"]')
      ) {
        return;
      }
      // Close if clicking outside the search dropdown
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false)
        setShowNotifications(false)
        setShowFriends(false)
        setSearchQuery('')
        setSearchResults([])
      }
    }

    const handleKeyDown = (event) => {
      // Only close on Escape key
      if (event.key === 'Escape') {
        setShowSearchResults(false)
        setShowNotifications(false)
        setShowFriends(false)
        setSearchQuery('')
        setSearchResults([])
      }
    }

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showSearchResults])

  // Fetch friend requests
  const fetchFriendRequests = async () => {
    if (!currentUser?.uid) return
    
    try {
      const requests = await getPendingFriendRequests(currentUser.uid)
      setFriendRequests(requests)
    } catch (error) {
      console.error('Failed to fetch friend requests:', error)
    }
  }

  // Fetch friends list
  const fetchFriends = async () => {
    if (!currentUser?.uid) return
    
    setFriendsLoading(true)
    try {
      const friendsList = await getFriends(currentUser.uid)
      setFriends(friendsList)
    } catch (error) {
      console.error('Failed to fetch friends:', error)
      setFriends([])
    } finally {
      setFriendsLoading(false)
    }
  }

  useEffect(() => {
    if (!currentUser?.uid) return
    
    fetchFriendRequests()
    
    // Poll for new requests every 60 seconds (reduced frequency)
    const interval = setInterval(fetchFriendRequests, 60000)
    return () => clearInterval(interval)
  }, [currentUser?.uid])

  const handleAcceptRequest = async (friendId) => {
    if (!currentUser?.uid) return
    
    // Optimistic update - remove from UI immediately
    setFriendRequests(prev => prev.filter(req => req.id !== friendId))
    
    try {
      await acceptFriendRequest(currentUser.uid, friendId)
      setSuccessMessage('Friend request accepted!')
      setShowSuccessModal(true)
      // Refresh friends list if showing
      if (showFriends) {
        fetchFriends()
      }
      // Wait a bit before refetching to ensure DB has committed
      setTimeout(() => {
        fetchFriendRequests()
      }, 1000)
    } catch (error) {
      console.error('Failed to accept request:', error)
      setErrorMessage('Failed to accept friend request. Please try again.')
      setShowErrorModal(true)
      // Revert optimistic update on error
      fetchFriendRequests()
    }
  }

  const handleRejectRequest = async (friendId) => {
    if (!currentUser?.uid) return
    
    // Optimistic update - remove from UI immediately
    setFriendRequests(prev => prev.filter(req => req.id !== friendId))
    
    try {
      await rejectFriendRequest(currentUser.uid, friendId)
      setSuccessMessage('Friend request declined')
      setShowSuccessModal(true)
    } catch (error) {
      console.error('Failed to reject request:', error)
      setErrorMessage('Failed to decline friend request. Please try again.')
      setShowErrorModal(true)
      // Revert optimistic update on error
      fetchFriendRequests()
    }
  }

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`)
    setShowSearchResults(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleCloseSearch = () => {
    setShowSearchResults(false)
    setShowNotifications(false)
    setShowFriends(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const isActive = (path) => location.pathname === path || (path !== '/home' && location.pathname.startsWith(path))
  const isOnBuyerPage = location.pathname === '/buyer'
  const isOnSellerPage = location.pathname === '/seller'
  const isOnNeedBoardPage = location.pathname === '/need-board'
  const isOnChatPage = location.pathname === '/chat'
  const isOnDashboardPage = location.pathname === '/dashboard'
  const isOnProfilePage = location.pathname.startsWith('/profile')

  const navLinks = [
    { label: 'Buy', path: '/buyer', icon: ShoppingBag },
    { label: 'Sell', path: '/seller', icon: Package },
    { label: 'NeedBoard AI', path: '/need-board', icon: Sparkles },
    { label: 'Chats', path: '/chat', icon: MessageCircle, badge: unreadCount },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ]

  // Bottom nav items (mobile only)
  const bottomNavItems = [
    { label: 'Buy', path: '/buyer', icon: ShoppingBag },
    { label: 'Sell', path: '/seller', icon: Package },
    { label: 'NeedBoard', path: '/need-board', icon: Sparkles },
    { label: 'Chats', path: '/chat', icon: MessageCircle, badge: unreadCount },
    { label: 'Profile', path: null, icon: User, action: handleProfileClick },
  ]

  return (
    <>
      {/* ===== TOP HEADER ===== */}
      <header className={`sticky top-0 z-50 h-16 sm:h-[72px] backdrop-blur-md border-b ${darkMode ? 'bg-neutral-900/95 border-neutral-800/80' : 'bg-white/95 border-slate-200/80'}`}>
        <div className="h-full px-4 sm:px-6 md:px-10 lg:px-20 flex items-center">
          <div className="flex items-center justify-between gap-4 w-full">

            {/* Logo */}
            <Link
              to="/home"
              className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity flex-shrink-0"
              data-testid="header-logo"
            >
              <img src="/UNIFIND.png" alt="UNIFIND Logo" className="h-10 sm:h-12 w-auto" />
              <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 900, letterSpacing: '-0.04em', color: '#003358' }} className="text-2xl sm:text-3xl">
                UNIFIND
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="flex items-center gap-1">
              {navLinks.map(({ label, path, icon: Icon, badge }) => {
                const active = isActive(path)
                return (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className={`hidden md:flex relative items-center gap-1.5 px-2 lg:px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 text-indigo-600'
                        : darkMode ? 'text-neutral-300 hover:bg-neutral-800 hover:text-indigo-400' : 'text-slate-600 hover:bg-slate-100 hover:text-slateigo-600'
                    }`}
                    title={label}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden lg:inline">{label}</span>
                    {badge > 0 && !active && (
                      <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                        {badge}
                      </span>
                    )}
                  </button>
                )
              })}

              {/* Notifications Bell - Removed from here */}

              {/* User Search Button */}
              <div className="relative ml-1 lg:ml-2" ref={searchRef}>
                <button
                  onClick={() => {
                    if (showSearchResults) {
                      // Close the dropdown
                      setShowSearchResults(false)
                      setSearchQuery('')
                      setSearchResults([])
                      setShowFriends(false)
                      setShowNotifications(false)
                    } else {
                      // Open the dropdown
                      setShowSearchResults(true)
                      fetchFriendRequests()
                      fetchFriends()
                    }
                  }}
                  className={`hidden md:flex relative items-center gap-1.5 px-2 lg:px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    showSearchResults
                      ? darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 text-indigo-600'
                      : darkMode ? 'text-neutral-300 hover:bg-neutral-800 hover:text-indigo-400' : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600'
                  }`}
                  title={showSearchResults ? "Close" : "Find Users & Notifications"}
                  data-testid="desktop-find-users-btn"
                >
                  {showSearchResults ? (
                    <>
                      <X className="h-4 w-4 flex-shrink-0" />
                      <span className="hidden xl:inline">Close</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 flex-shrink-0" />
                      <span className="hidden xl:inline">Find Users</span>
                    </>
                  )}
                  {!showSearchResults && friendRequests.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                      {friendRequests.length}
                    </span>
                  )}
                </button>

                {/* Mobile Backdrop */}
                {showSearchResults && (
                  <div 
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={() => {
                      setShowSearchResults(false)
                      setSearchQuery('')
                      setSearchResults([])
                      setShowFriends(false)
                      setShowNotifications(false)
                    }}
                  />
                )}

                {/* User Search & Notifications Dropdown */}
                {showSearchResults && (
                  <div className={`fixed md:absolute top-[72px] md:top-full left-2 right-2 md:left-auto md:right-0 mt-0 md:mt-2 w-auto md:w-96 max-w-none md:max-w-[384px] rounded-xl shadow-xl border z-50 ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200'}`}>
                    {/* Tabs */}
                    <div className={`flex border-b ${darkMode ? 'border-neutral-800' : 'border-slate-200'}`}>
                      <button
                        onClick={() => {
                          setShowNotifications(false)
                          setShowFriends(false)
                        }}
                        className={`flex-1 px-2 sm:px-3 py-3 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                          !showNotifications && !showFriends
                            ? darkMode 
                              ? 'text-indigo-400 border-b-2 border-indigo-400' 
                              : 'text-indigo-600 border-b-2 border-indigo-600'
                            : darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Search
                      </button>
                      <button
                        onClick={() => {
                          setShowFriends(true)
                          setShowNotifications(false)
                          fetchFriends()
                        }}
                        className={`flex-1 px-2 sm:px-3 py-3 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                          showFriends
                            ? darkMode 
                              ? 'text-indigo-400 border-b-2 border-indigo-400' 
                              : 'text-indigo-600 border-b-2 border-indigo-600'
                            : darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Friends
                      </button>
                      <button
                        onClick={() => {
                          setShowNotifications(true)
                          setShowFriends(false)
                        }}
                        className={`relative flex-1 px-2 sm:px-3 py-3 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                          showNotifications
                            ? darkMode 
                              ? 'text-indigo-400 border-b-2 border-indigo-400' 
                              : 'text-indigo-600 border-b-2 border-indigo-600'
                            : darkMode ? 'text-slate-400 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Requests
                        {friendRequests.length > 0 && (
                          <span className="ml-1 sm:ml-1.5 bg-red-600 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">
                            {friendRequests.length}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Search Tab Content */}
                    {!showNotifications && !showFriends && (
                      <>
                        <div className={`p-3 border-b ${darkMode ? 'border-neutral-800' : 'border-slate-200'}`}>
                          <div className="relative">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                            <input
                              type="text"
                              placeholder="Search users..."
                              value={searchQuery}
                              onChange={(e) => handleSearch(e.target.value)}
                              autoFocus
                              className={`w-full pl-9 pr-3 py-2.5 rounded-lg border outline-none text-sm ${
                                darkMode 
                                  ? 'bg-neutral-800 border-neutral-700 text-neutral-200 placeholder-neutral-500 focus:border-indigo-500' 
                                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                              }`}
                            />
                          </div>
                        </div>
                        <div className="max-h-[60vh] md:max-h-96 overflow-y-auto">
                          {searchLoading ? (
                            <div className="p-4 text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                            </div>
                          ) : searchResults.length > 0 ? (
                            <div className="py-2">
                              {searchResults.map((user) => (
                                <button
                                  key={user.id}
                                  onClick={() => handleUserClick(user.id)}
                                  className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${darkMode ? 'hover:bg-neutral-800' : 'hover:bg-slate-50'}`}
                                >
                                  <img
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`}
                                    alt={user.name}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                  <div className="flex-1 text-left">
                                    <p className={`font-semibold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{user.name}</p>
                                    {user.college && (
                                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{user.college}</p>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : searchQuery.length >= 2 ? (
                            <div className="p-4 text-center">
                              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>No users found</p>
                            </div>
                          ) : (
                            <div className="p-8 text-center">
                              <UserPlus className={`h-12 w-12 mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Type to search users...</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Friends Tab Content */}
                    {showFriends && (
                      <div className="max-h-[60vh] md:max-h-96 overflow-y-auto">
                        {friendsLoading ? (
                          <div className="p-4 text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                          </div>
                        ) : friends.length > 0 ? (
                          <div className="py-2">
                            {friends.map((friend) => (
                              <button
                                key={friend.id}
                                onClick={() => handleUserClick(friend.id)}
                                className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${darkMode ? 'hover:bg-neutral-800' : 'hover:bg-slate-50'}`}
                              >
                                <img
                                  src={friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name || 'User')}`}
                                  alt={friend.name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                                <div className="flex-1 text-left">
                                  <p className={`font-semibold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{friend.name}</p>
                                  {friend.college && (
                                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{friend.college}</p>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <User className={`h-12 w-12 mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>No friends yet</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notifications Tab Content */}
                    {showNotifications && (
                      <div className="max-h-[60vh] md:max-h-96 overflow-y-auto">
                        {friendRequests.length > 0 ? (
                          <div className="py-2">
                            {friendRequests.map((request) => (
                              <div
                                key={request.id}
                                className={`px-4 py-3 border-b last:border-b-0 ${darkMode ? 'border-neutral-800' : 'border-slate-100'}`}
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <img
                                    src={request.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.name || 'User')}`}
                                    alt={request.name}
                                    className="h-10 w-10 rounded-full object-cover cursor-pointer"
                                    onClick={() => {
                                      navigate(`/profile/${request.id}`)
                                      setShowSearchResults(false)
                                    }}
                                  />
                                  <div className="flex-1">
                                    <p 
                                      className={`font-semibold text-sm cursor-pointer hover:text-indigo-600 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}
                                      onClick={() => {
                                        navigate(`/profile/${request.id}`)
                                        setShowSearchResults(false)
                                      }}
                                    >
                                      {request.name}
                                    </p>
                                    {request.college && (
                                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{request.college}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAcceptRequest(request.id)}
                                    className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all active:scale-95"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleRejectRequest(request.id)}
                                    className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                                      darkMode 
                                        ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200' 
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <Bell className={`h-12 w-12 mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>No pending friend requests</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Button */}
              <button
                onClick={() => navigate(currentUser?.uid ? `/profile/${currentUser.uid}` : '/profile')}
                className={`hidden md:flex ml-1 lg:ml-2 relative items-center gap-1.5 px-2 lg:px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isOnProfilePage
                    ? 'bg-indigo-600 text-white shadow-glow-indigo'
                    : 'btn-gradient'
                }`}
                data-testid="header-profile-btn"
                title="Profile"
              >
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="avatar" className="h-5 w-5 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <User className="h-4 w-4 flex-shrink-0" />
                )}
                <span className="hidden lg:inline">Profile</span>
              </button>
            </nav>

            {/* Mobile Top-Right Action */}
            {isOnChatPage ? (
              <div className="md:hidden flex items-center gap-1">
                <button
                  className={`p-2 rounded-xl transition-colors relative ${
                    showSearchResults
                      ? darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 text-indigo-600'
                      : darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  onClick={() => {
                    if (showSearchResults) {
                      setShowSearchResults(false)
                      setSearchQuery('')
                      setSearchResults([])
                      setShowFriends(false)
                      setShowNotifications(false)
                    } else {
                      setShowSearchResults(true)
                      fetchFriendRequests()
                      fetchFriends()
                    }
                  }}
                  data-testid="mobile-find-users-btn-chat"
                  aria-label={showSearchResults ? "Close" : "Find Users"}
                >
                  {showSearchResults ? <X className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                  {!showSearchResults && friendRequests.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                      {friendRequests.length}
                    </span>
                  )}
                </button>
                <button
                  className={`p-2 rounded-xl transition-colors ${darkMode ? 'text-neutral-300 hover:bg-neutral-800' : 'text-slate-600 hover:bg-slate-100'}`}
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  data-testid="mobile-menu-btn"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            ) : (
              <div className="md:hidden flex items-center gap-1">
                <button
                  className={`p-2 rounded-xl transition-colors relative ${
                    showSearchResults
                      ? darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 text-indigo-600'
                      : darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  onClick={() => {
                    if (showSearchResults) {
                      setShowSearchResults(false)
                      setSearchQuery('')
                      setSearchResults([])
                      setShowFriends(false)
                      setShowNotifications(false)
                    } else {
                      setShowSearchResults(true)
                      fetchFriendRequests()
                      fetchFriends()
                    }
                  }}
                  data-testid="mobile-find-users-btn"
                  aria-label={showSearchResults ? "Close" : "Find Users"}
                >
                  {showSearchResults ? <X className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                  {!showSearchResults && friendRequests.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                      {friendRequests.length}
                    </span>
                  )}
                </button>
                <button
                  className={`p-2 rounded-xl transition-colors ${darkMode ? 'text-indigo-400 hover:bg-neutral-800' : 'text-indigo-600 hover:bg-indigo-50'}`}
                  onClick={() => navigate('/dashboard')}
                  data-testid="mobile-dashboard-btn"
                  aria-label="Dashboard"
                >
                  <LayoutDashboard className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="absolute top-full left-0 w-screen h-[100dvh] bg-black/40 z-40 md:hidden animate-fade-in"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <div className={`absolute top-full left-0 right-0 z-50 md:hidden border-b shadow-xl animate-fade-in-up max-h-[calc(100dvh-80px)] overflow-y-auto ${darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200'}`}>
              <div className="px-4 py-4 space-y-1">
                {navLinks.map(({ label, path, icon: Icon, badge }) => {
                  const active = isActive(path)
                  return (
                    <button
                      key={path}
                      onClick={() => { navigate(path); setMobileMenuOpen(false) }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        active
                          ? darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 text-indigo-700'
                          : darkMode ? 'text-neutral-300 hover:bg-neutral-800' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${active ? (darkMode ? 'text-indigo-400' : 'text-indigo-600') : (darkMode ? 'text-slate-500' : 'text-slate-400')}`} />
                      {label}
                      {badge > 0 && (
                        <span className={`ml-auto text-xs rounded-full px-2 py-0.5 font-bold ${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                          {badge}
                        </span>
                      )}
                    </button>
                  )
                })}
                <div className={`pt-2 border-t ${darkMode ? 'border-neutral-800' : 'border-slate-100'}`}>

                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold btn-gradient"
                  >
                    <User className="h-5 w-5" />
                    My Profile
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* ===== MOBILE BOTTOM NAV ===== */}
      {!isOnChatPage && (
        <nav className="mobile-bottom-nav pb-[env(safe-area-inset-bottom)]" data-testid="mobile-bottom-nav">
          {bottomNavItems.map(({ label, path, icon: Icon, badge, action }) => {
            const active = path ? isActive(path) : isOnProfilePage
            return (
              <button
                key={label}
                onClick={() => {
                  if (action) { action() }
                  else { navigate(path); setMobileMenuOpen(false) }
                }}
                className={`mobile-nav-item ${active ? 'active' : ''}`}
                data-testid={`bottom-nav-${label.toLowerCase()}`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
                  {badge > 0 && !active && (
                    <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[9px] rounded-full h-3.5 w-3.5 flex items-center justify-center font-bold">
                      {badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold leading-none transition-all duration-200 hidden sm:inline ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {label}
                </span>
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-indigo-600 rounded-full" />
                )}
              </button>
            )
          })}
        </nav>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-xl ${darkMode ? 'bg-neutral-900' : 'bg-white'}`}>
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Success!
              </h3>
              <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className={`w-full max-w-md rounded-2xl shadow-xl ${darkMode ? 'bg-neutral-900' : 'bg-white'}`}>
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Error
              </h3>
              <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
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
    </>
  )
}
