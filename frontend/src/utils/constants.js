export const CATEGORIES = [
  'All',
  'Laptops',
  'Phones',
  'Tablets',
  'Cameras',
  'Accessories',
  'Books',
  'Furniture'
]

export const CONDITIONS = [
  { value: 'like-new', label: 'Like New', score: 95 },
  { value: 'excellent', label: 'Excellent', score: 85 },
  { value: 'good', label: 'Good', score: 75 },
  { value: 'fair', label: 'Fair', score: 60 }
]

export const FIREBASE_ERRORS = {
  'auth/user-not-found': 'Invalid email or password.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/too-many-requests': 'Too many attempts. Try again later.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
}
