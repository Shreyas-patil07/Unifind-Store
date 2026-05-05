# UNIFIND - Production Deployment Guide

## Overview
This guide covers deploying UNIFIND to production:
- Backend: Render (Free tier)
- Frontend: Vercel (Free tier)
- Database: Firebase Firestore (Already cloud-hosted)

## Prerequisites
- GitHub account
- Render account (https://render.com)
- Vercel account (https://vercel.com)
- Firebase project with Firestore enabled
- Gemini API key (https://makersuite.google.com/app/apikey)

---

## Part 1: Backend Deployment (Render)

### Step 1: Prepare Repository
1. Ensure all changes are committed to GitHub
2. Push to your main branch

### Step 2: Create Render Web Service
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: unifind-backend
   - **Region**: Oregon (US West)
   - **Branch**: main
   - **Root Directory**: backend
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

### Step 3: Set Environment Variables
In Render dashboard, add these environment variables:

```
ENVIRONMENT=production

# Firebase Service Account (from Firebase Console)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Email Configuration (Gmail SMTP)
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# CORS (add your Vercel domain after frontend deployment)
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000
```

**Important Notes:**
- For `GMAIL_APP_PASSWORD`: Generate from [Google App Passwords](https://myaccount.google.com/apppasswords)
- For `FIREBASE_PRIVATE_KEY`: Keep the `\n` characters for newlines

### Step 4: Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Note your backend URL: `https://unifind-backend.onrender.com`

### Step 5: Verify Deployment
Visit: `https://unifind-backend.onrender.com/api/health`

Should return:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "environment": "production"
}
```

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend
1. Update `frontend/.env` with production backend URL:
```
VITE_API_URL=https://unifind-backend.onrender.com/api
```

2. Commit and push changes

### Step 2: Deploy to Vercel
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: frontend
   - **Build Command**: `npm run build`
   - **Output Directory**: dist

### Step 3: Set Environment Variables
In Vercel project settings → Environment Variables, add:

```
# Firebase Client Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Backend API URL
VITE_API_URL=https://unifind-backend.onrender.com/api
```

### Step 4: Deploy
1. Click "Deploy"
2. Wait for deployment (2-3 minutes)
3. Note your frontend URL: `https://your-app.vercel.app`

### Step 5: Update Backend CORS
1. Go back to Render dashboard
2. Update `CORS_ORIGINS` environment variable:
```
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000
```
3. Redeploy backend

---

## Part 3: Post-Deployment Configuration

### Firebase Security Rules
Update Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection - read public, write own
    match /users/{userId} {
      allow read: if true;  // Public read for user discovery
      allow write: if isOwner(userId) || isOwner(resource.data.firebase_uid);
    }
    
    // User profiles - read public, write own
    match /user_profiles/{profileId} {
      allow read: if true;  // Public read for profiles
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() 
        && request.auth.uid == resource.data.user_id;
    }
    
    // Products - read all, write own
    match /products/{productId} {
      allow read: if true;  // Public read for marketplace
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() 
        && request.auth.uid == resource.data.seller_id;
    }
    
    // Chat rooms - read/write if participant
    match /chat_rooms/{chatId} {
      allow read: if isAuthenticated() 
        && (request.auth.uid == resource.data.user1_id 
            || request.auth.uid == resource.data.user2_id);
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() 
        && (request.auth.uid == resource.data.user1_id 
            || request.auth.uid == resource.data.user2_id);
      allow delete: if false;  // Prevent deletion
    }
    
    // Messages - read/write if authenticated (chat room access controlled by backend)
    match /messages/{messageId} {
      allow read, write: if isAuthenticated();
    }
    
    // Friendships - read/write if participant
    match /friendships/{friendshipId} {
      allow read: if isAuthenticated() 
        && (request.auth.uid == resource.data.user_id 
            || request.auth.uid == resource.data.friend_id);
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() 
        && (request.auth.uid == resource.data.user_id 
            || request.auth.uid == resource.data.friend_id);
      allow delete: if isAuthenticated() 
        && (request.auth.uid == resource.data.user_id 
            || request.auth.uid == resource.data.friend_id);
    }
    
    // Reviews - read all, write if authenticated
    match /reviews/{reviewId} {
      allow read: if true;  // Public read for trust system
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() 
        && request.auth.uid == resource.data.reviewer_id;
    }
    
    // Transaction history - read/write own
    match /transaction_history/{transactionId} {
      allow read, write: if isAuthenticated() 
        && request.auth.uid == resource.data.user_id;
    }
    
    // Need board searches - read/write own
    match /need_board_searches/{searchId} {
      allow read, write: if isAuthenticated() 
        && request.auth.uid == resource.data.user_id;
    }
  }
}
```

**Security Notes**:
- All write operations require authentication
- Users can only modify their own data
- Chat rooms accessible only to participants
- Products editable only by seller
- Reviews editable only by reviewer
- Public read access for marketplace discovery
- Transaction history private to user

### Firebase Indexes
Firebase requires composite indexes for multi-field queries. Deploy using the provided configuration file:

```bash
# Deploy all indexes at once (recommended)
firebase deploy --only firestore:indexes
```

The `firestore.indexes.json` file includes optimized indexes for all collections. Key indexes:

1. **products**
   - category + posted_date (browsing)
   - seller_id + posted_date (seller dashboard)
   - is_active + mark_as_sold + created_at (listing queries)
   - category + is_active + created_at (filtered browsing)

2. **messages**
   - chat_room_id + timestamp (chat ordering)
   - sender_id + timestamp (user messages)

3. **reviews**
   - reviewed_user_id + created_at (user reviews)
   - product_id + created_at (product reviews)

4. **chat_rooms**
   - user1_id + last_message_time (user chats)
   - user2_id + last_message_time (user chats)

5. **friendships**
   - user_id + status + created_at (friend lists)
   - friend_id + status + created_at (friend lists)

6. **need_board_searches**
   - user_id + created_at (search history)

7. **needs** (demand-supply engine)
   - user_id + created_at (user needs)
   - status + created_at (active needs)

8. **transaction_history**
   - seller_id + created_at (seller transactions)
   - buyer_id + created_at (buyer transactions)

**Index Build Time**: 5-30 minutes depending on data size

**Monitoring**: Firebase Console → Firestore → Indexes (wait for "Enabled" status)

**Note**: Firebase will prompt you to create indexes when queries fail. Click the provided link to auto-create the required index.

---

## Part 4: Transaction History Setup

### Migration (One-Time)
After deploying the backend, run the migration script to populate transaction history for existing products:

```bash
# Local
cd backend
python migrate_transaction_history.py

# Production (Render)
# Use Render Shell or run via deployment script
```

Expected output:
```
Migration Summary:
Total products: X
Transaction histories created: Y
Skipped (already exists): Z
Errors: 0
```

### Verification
1. Check Firestore Console for `transaction_history` collection
2. Verify records have all required fields
3. Test marking a product as sold/active
4. Confirm new transaction history records are created

## Part 5: Monitoring & Maintenance

### Health Checks
- Backend health: `https://unifind-backend.onrender.com/api/health`
- Backend readiness: `https://unifind-backend.onrender.com/api/ready`

### Logs
- **Render**: Dashboard → Your Service → Logs
- **Vercel**: Dashboard → Your Project → Deployments → View Function Logs

### Performance Monitoring
1. Enable Render metrics in dashboard
2. Enable Vercel Analytics in project settings
3. Monitor Firebase usage in Firebase Console

### Common Issues

**Issue: Backend cold starts (Render free tier)**
- Solution: First request after inactivity takes 30-60s
- Workaround: Use a cron job to ping health endpoint every 10 minutes

**Issue: CORS errors**
- Solution: Verify CORS_ORIGINS includes your Vercel domain
- Check: No trailing slashes in URLs

**Issue: Firebase connection fails**
- Solution: Verify all Firebase env vars are set correctly
- Check: FIREBASE_PRIVATE_KEY has proper newlines (\n)

**Issue: Email verification not working**
- Solution: Verify GMAIL_USER and GMAIL_APP_PASSWORD are set
- Check: Gmail App Password is generated (not regular password)
- Test: Run `python backend/test_email.py` locally first
- Verify: Check Render logs for SMTP errors

**Issue: Gemini API errors**
- Solution: Verify API key is valid
- Check: API quota not exceeded

**Issue: Chat messages disappearing**
- Solution: Ensure frontend is using latest ChatPage.jsx with Map-based merge
- Check: Backend logs show correct chat_room_id generation
- Verify: No ad blockers blocking Firebase API calls (ERR_BLOCKED_BY_CLIENT)

**Issue: Duplicate chat messages**
- Solution: Verify Map-based deduplication is working
- Check: Message IDs are unique from backend
- Debug: Console log message IDs to verify uniqueness

**Issue: Chat room ID mismatch**
- Solution: Backend generates deterministic ID using min/max logic
- Check: Frontend uses selectedChat.id from backend
- Verify: Both send and fetch use same chat_room_id format

---

## Part 6: Scaling Considerations

### Current Limits (Free Tier)
- Render: 512MB RAM, sleeps after 15min inactivity
- Vercel: 100GB bandwidth/month
- Firebase: 50K reads, 20K writes per day
- Gemini: Rate limited per API key

### Scaling to 1K-10K Users

**Backend (Render)**
- Upgrade to Starter plan ($7/month): No sleep, more RAM
- Add Redis for caching AI responses
- Implement request queuing for AI endpoints

**Frontend (Vercel)**
- Pro plan if bandwidth exceeds 100GB
- Enable Vercel Edge Network
- Implement client-side caching

**Database (Firebase)**
- Upgrade to Blaze plan (pay-as-you-go)
- Optimize queries with proper indexes
- Implement pagination for large collections

**AI (Gemini)**
- Implement aggressive caching
- Use batch processing for multiple queries
- Consider fallback to simpler matching algorithm

---

## Part 7: Security Checklist

- [ ] All API keys in environment variables (not in code)
- [ ] Firebase security rules configured
- [ ] CORS properly configured
- [ ] HTTPS enforced (automatic on Render/Vercel)
- [ ] Rate limiting enabled on AI endpoints
- [ ] Input validation on all endpoints
- [ ] Error messages don't expose sensitive info
- [ ] Firebase Admin SDK credentials secured

---

## Part 8: Rollback Procedure

### Backend Rollback (Render)
1. Go to Render dashboard → Your Service
2. Click "Manual Deploy" → Select previous commit
3. Deploy

### Frontend Rollback (Vercel)
1. Go to Vercel dashboard → Your Project → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

---

## Support

For deployment issues:
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- Firebase: https://firebase.google.com/docs

For application issues:
- GitHub Issues: https://github.com/Shreyas-patil07/UNIFIND/issues
- Email: systemrecord07@gmail.com

---

## Quick Reference

### Backend URLs
- Production: `https://unifind-backend.onrender.com`
- Health: `/api/health`
- API Docs: `/docs` (disabled in production)

### Frontend URLs
- Production: `https://your-app.vercel.app`
- Preview: Auto-generated for each PR

### Key Commands
```bash
# Local development
cd backend && python main.py
cd frontend && npm run dev

# Build frontend
cd frontend && npm run build

# Test production build locally
cd frontend && npm run preview
```

---

**Last Updated**: April 6, 2026
**Version**: 2.0.0
