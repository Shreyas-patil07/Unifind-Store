# 🚀 UNIFIND - Quick Start Guide

Get UNIFIND running in 5 minutes.

---

## Prerequisites

- Node.js 18.0+ ([Download](https://nodejs.org/))
- Python 3.11+ ([Download](https://www.python.org/downloads/))
- Git ([Download](https://git-scm.com/downloads))
- Firebase Account ([Sign up](https://firebase.google.com/))

Check versions:
```bash
node --version    # Should be 18.0+
python --version  # Should be 3.11+
```

---

## Step 1: Clone Repository

```bash
git clone https://github.com/Shreyas-patil07/UNIFIND.git
cd UNIFIND
```

---

## Step 2: Firebase Setup

1. Create Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database (test mode)
3. Enable Email/Password Authentication
4. Get credentials:
   - **Frontend**: Project Settings → Web app config
   - **Backend**: Project Settings → Service accounts → Generate private key

---

## Step 3: Configure Environment

### Backend `.env`
```env
# Firebase Service Account (from downloaded JSON)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
# ... (copy all fields from JSON)

CORS_ORIGINS=http://localhost:3000,http://localhost:5173
GEMINI_API_KEY=your-gemini-api-key  # Optional
```

### Frontend `.env`
```env
# Firebase Client Config
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

VITE_API_URL=http://localhost:8000/api
```

---

## Step 4: Install Dependencies

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend (new terminal)
```bash
cd frontend
npm install
```

---

## Step 5: Run Application

### Terminal 1 - Backend
```bash
cd backend
python main.py
```
✅ Backend: http://localhost:8000  
✅ API Docs: http://localhost:8000/docs

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
✅ Frontend: http://localhost:5173

---

## Step 6: Deploy Firestore Indexes (Recommended)

For optimal performance, deploy database indexes:

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy indexes (from project root)
firebase deploy --only firestore:indexes
```

⏰ **Wait Time**: 5-30 minutes for indexes to build

✅ **Benefit**: 10-20x faster queries, 80% faster page loads

**Check Status**: Firebase Console → Firestore → Indexes (wait for "Enabled")

---

## Step 7: Test

1. Open http://localhost:5173
2. Click "Sign Up"
3. Create account
4. Check email for verification link
5. Verify and log in

---

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:8000 | xargs kill -9
```

### Module Not Found
```bash
# Backend
pip install -r requirements.txt

# Frontend
rm -rf node_modules package-lock.json
npm install
```

### Firebase Connection Failed
- Double-check credentials in `.env` files
- Ensure Firestore and Authentication are enabled
- Verify no typos in environment variables

### CORS Error
- Verify `CORS_ORIGINS` includes frontend URL
- Restart backend after changing `.env`

### Slow Performance
- Deploy Firestore indexes (see Step 6)
- Check backend logs for query warnings
- Verify indexes show "Enabled" in Firebase Console

---

## Next Steps

- **Development**: See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- **Deployment**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Full Docs**: See [DOCUMENTATION.md](DOCUMENTATION.md)

---

**Made with ❤️ by Numero Uno Team**
