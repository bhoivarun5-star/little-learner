# 🌟 Little Learner — Offline-First Preschool PWA

A production-ready, offline-first Progressive Web Application for preschool children aged 3–6.
Built with React + Vite (frontend) and Django REST Framework + Supabase PostgreSQL (backend).

---

## 🏗️ Architecture

```
React + Vite PWA
  ├── Service Worker (Workbox) — App Shell Cache
  ├── IndexedDB (Dexie.js)    — All persistent data (source of truth)
  └── React State             — Ephemeral UI only
         │
         │ REST API (only when ONLINE)
         ▼
Django REST Framework
  ├── accounts / children / learning / games / quiz / progress / sync
  └── Supabase PostgreSQL (cloud database)
```

## 📁 Project Structure

```
little-learner/
├── backend/              # Django REST Framework
│   ├── accounts/         # User auth (JWT)
│   ├── children/         # Child profiles
│   ├── learning/         # Modules, lessons
│   ├── games/            # Game definitions
│   ├── quiz/             # Quizzes, questions, answers
│   ├── progress/         # Progress, scores, badges
│   ├── content/          # Module versioning
│   ├── sync_engine/      # Sync push/pull API
│   └── config/           # Django settings, URLs
│
└── frontend/             # React + Vite PWA
    └── src/
        ├── api/          # Axios client (auto-JWT from IndexedDB)
        ├── components/   # ConnectivityBar, BottomNav
        ├── db/           # Dexie.js schema
        ├── games/        # 5 educational games + state hook
        ├── hooks/        # useAuth, useChild
        ├── pages/        # All app pages
        ├── services/     # auth, connectivity, data
        └── sync/         # SyncEngine (outbox pattern)
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set USE_SQLITE=True for local dev

# Run migrations
python manage.py migrate

# Seed learning content (all 10 modules, 80+ lessons, 5 games, 3 quizzes)
python manage.py seed_data

# Create admin user
python manage.py createsuperuser

# Start the API server
python manage.py runserver
```

Backend will be available at: `http://localhost:8000`
Admin panel: `http://localhost:8000/admin/`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (already done, edit if needed)
# VITE_API_BASE_URL=http://localhost:8000/api

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### 3. First Use

1. Open `http://localhost:5173`
2. Click **Register here** to create a parent account
3. Add a child profile with an avatar and optional PIN
4. Start learning!

---

## 🗄️ Database Configuration

### Option A: SQLite (Local Development — Default)
The `.env` file already has `USE_SQLITE=True`. No setup needed.

### Option B: Supabase PostgreSQL (Production)

1. Create a [Supabase](https://supabase.com) project
2. Go to **Settings → Database** and copy the connection string
3. In `backend/.env`:
```env
USE_SQLITE=False
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_KEY=your-anon-key
```
4. Run `python manage.py migrate`

---

## 📱 PWA Installation

### Android (Chrome)
1. Open the app in Chrome
2. Tap the **"Install"** banner or go to Chrome menu → **Add to Home Screen**
3. App installs and works fully offline

### Desktop (Chrome/Edge)
1. Look for the install icon (⊕) in the address bar
2. Click **Install**

---

## 🔌 Offline-First Architecture

### What works offline?
- ✅ All previously loaded learning modules
- ✅ All 5 games (full gameplay with state persistence)
- ✅ Lesson completion tracking
- ✅ Quiz results
- ✅ Badge earning
- ✅ Progress viewing
- ✅ Child profile access
- ✅ App shell (all UI components)

### What requires internet?
- ❌ Initial account registration
- ❌ First-time login (subsequent logins: offline session)
- ❌ Loading modules not yet downloaded
- ❌ Syncing progress to cloud

### How sync works
```
1. All writes go to IndexedDB first (instant, always works)
2. A SyncQueue entry is created for each write
3. When internet connects → SyncEngine pushes all pending ops to Django
4. Conflict resolution: scores are additive (never go backward)
5. On failure: exponential backoff (1s, 2s, 4s, 8s, 16s), max 5 retries
```

---

## 🧪 Offline Testing

### Test 1: Module works after going offline

```
1. Open the app and log in (online)
2. Go to Parent Dashboard → Modules tab
3. Click "Download" on the Alphabet module
4. Wait for download to complete
5. Turn off WiFi / disable network
6. Navigate to Learn → Alphabet
7. ✅ PASS: All lessons load and work
```

### Test 2: Game state survives page refresh

```
1. Go to Games → Alphabet Match
2. Play until score reaches 60+
3. While offline, press F5 (refresh)
4. ✅ PASS: Game resumes from saved state
```

### Test 3: Lesson progress survives browser close

```
1. Go offline (disable network)
2. Open Learn → Colors
3. Complete 3 lessons
4. Close the browser completely
5. Reopen the app (still offline)
6. Go to Progress page
7. ✅ PASS: 3 completed lessons are shown
```

### Test 4: Data syncs when reconnected

```
1. Go completely offline
2. Complete several lessons and games
3. Check Parent Dashboard → Sync tab (shows pending count)
4. Re-enable internet
5. The app auto-syncs within 15 seconds
6. ✅ PASS: Sync tab shows 0 pending
7. Verify in Django admin: progress records exist
```

### Test 5: API failure doesn't break the app

```
1. Stop the Django server: Ctrl+C in backend terminal
2. Refresh the frontend (still on localhost:5173)
3. ✅ PASS: App loads from service worker cache
4. ✅ PASS: Can still navigate, play games, view progress
5. ✅ PASS: Shows "Offline" status bar (API unreachable)
```

---

## 🔐 Security Notes

- Passwords hashed by Django (bcrypt)
- JWTs stored in IndexedDB (not localStorage)
- JWT refresh tokens with rotation + blacklisting
- Supabase credentials only on backend (never exposed to frontend)
- Child PINs stored as plaintext (short 4-digit convenience code, not sensitive)
- CORS restricted to configured origins
- All sensitive endpoints require authentication

---

## 🚢 Production Deployment

### Backend (e.g., Railway / Fly.io / Render)

```bash
# Set environment variables on your platform:
SECRET_KEY=<strong-random-key>
DEBUG=False
ALLOWED_HOSTS=your-domain.com
DATABASE_URL=postgresql://...supabase...
USE_SQLITE=False
CORS_ALLOWED_ORIGINS=https://your-frontend.com

# Collect static files
python manage.py collectstatic

# Start with gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

### Frontend (e.g., Netlify / Vercel)

```bash
# Set environment variable:
VITE_API_BASE_URL=https://your-backend.com/api

# Build
npm run build

# Deploy the dist/ folder
```

> **IMPORTANT**: Add `_redirects` file to `dist/` for single-page app routing:
> ```
> /*  /index.html  200
> ```

---

## 📚 Learning Modules

| # | Module | Emoji | Lessons | Size |
|---|--------|-------|---------|------|
| 1 | Alphabet | 🔤 | 26 (A-Z) | 15 MB |
| 2 | Numbers | 🔢 | 20 (1-20) | 12 MB |
| 3 | Colors | 🎨 | 10 | 10 MB |
| 4 | Shapes | ⭐ | 8 | 8 MB |
| 5 | Animals | 🐾 | 12 | 25 MB |
| 6 | Fruits & Vegetables | 🍎 | Available | 18 MB |
| 7 | Basic Words | 💬 | Available | 10 MB |
| 8 | Stories | 📖 | 2 stories | 30 MB |
| 9 | Mathematics | ➕ | Available | 14 MB |
| 10 | English | 🇬🇧 | Available | 20 MB |

## 🎮 Games

| Game | Description | Levels |
|------|-------------|--------|
| Alphabet Match | Match letter to word picture | 3 |
| Number Match | Count objects, tap correct number | 3 |
| Memory Cards | Flip and match emoji pairs | 3 |
| Shape Sorter | Tap shape, tap matching slot | 3 |
| Counting Game | Tap items to count, select answer | 3 |

## 🏆 Badges

| Badge | Trigger |
|-------|---------|
| 🌟 First Lesson | Complete first lesson |
| 🔥 3-Day Streak | 3 consecutive days |
| 🏆 Week Warrior | 7 consecutive days |
| 🎯 Quiz Champion | Perfect quiz score |
| 🎮 Game Master | Complete all game levels |
| 🔤 ABC Expert | Complete Alphabet module |
| 🔢 Number Ninja | Complete Numbers module |
| 🎨 Color Wizard | Complete Colors module |
| ⭐ Shape Star | Complete Shapes module |
| 🐾 Animal Friend | Complete Animals module |
| 🚀 Super Learner | Complete all modules |

---

## 🔧 API Endpoints Reference

```
POST  /api/auth/register/          Register new parent/teacher
POST  /api/auth/login/             Login → JWT tokens
POST  /api/auth/refresh/           Refresh JWT
POST  /api/auth/logout/            Invalidate refresh token

GET   /api/children/               List children (requires auth)
POST  /api/children/               Create child
POST  /api/children/{id}/verify-pin/  Verify child PIN

GET   /api/modules/                List all published modules
GET   /api/modules/{slug}/         Module detail with lessons
GET   /api/modules/{slug}/manifest/ Asset manifest for download

GET   /api/games/                  List all games
GET   /api/quiz/                   List all quizzes

GET   /api/progress/{child_id}/    Child full progress report
POST  /api/progress/lesson-complete/
POST  /api/progress/game-score/
POST  /api/progress/quiz-result/

POST  /api/sync/push/              Bulk sync from client
GET   /api/sync/pull/{child_id}/   Pull server changes

GET   /api/content/version/        Module version manifest
GET   /ping/                       Connectivity check endpoint
```

---

## ⚡ Conflict Resolution Strategy

When the same data is modified both offline and on the server:

- **Progress percentage**: Take the maximum (progress never goes backward)
- **Lesson completions**: Union (never remove a completion)
- **Game scores**: Additive (each score creates a new record)
- **Quiz results**: Additive (each attempt creates a new record)
- **Profile/settings**: Server timestamp wins (last write wins)

Idempotency is guaranteed via `local_id` deduplication on the server.

---

## 🤝 Contributing

```bash
# Backend tests
cd backend && python manage.py test

# Frontend lint check
cd frontend && npm run lint

# Frontend build check  
cd frontend && npm run build
```
